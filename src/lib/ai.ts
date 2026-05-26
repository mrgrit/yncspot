/**
 * AI 어시스턴트 '도약' — Anthropic API 호출 + 컨텍스트 구성 + 폴백 응답.
 * 모델은 한 곳(AI_MODEL)에서 관리한다.
 */
import { BRAND } from "@/config/brand";
import type { Dataset, User } from "@/types";
import {
  learningSummary,
  userAreaProgress,
  userBadges,
  recommendedPrograms,
  recommendedSpotsForUser,
} from "@/lib/selectors";
import { GRADE_LABEL, TRACK_LABEL } from "@/lib/utils";

export const AI_MODEL = "claude-sonnet-4-20250514";
export const AI_KEY_STORAGE = "ync-jump-spot.anthropic_key";

export const SYSTEM_PROMPT = `당신은 ${BRAND.systemName}의 진로 코치 '${BRAND.displayName}'입니다.
사용자는 청년도약 부트캠프 참여자이며, 이름·트랙·등급·이수내역·Spot이력이 컨텍스트로 제공됩니다.
다음 규칙을 따르세요:
1. 친근한 반말은 사용하지 않고, 존중하는 평어체를 사용합니다.
2. 답변은 항상 (현재 상태) → (제안) → (다음 액션) 구조로 작성합니다.
3. 수강·이수 추천 시 "교양·사회 + AI공통 + 실전·전문 동시이수" 원칙을 고려합니다.
4. Spot 추천 시 사용자 등급·관심사·과거 평점을 기반으로 3개 이내로 제시합니다.
5. 모르는 정보는 "사업단 운영자에게 문의"로 안내합니다.`;

export interface UserContext {
  name: string;
  track: string;
  grade: string;
  spotCount: number;
  interests: string[];
  completedCourses: string[];
  recommendedCourses: string[];
  recommendedSpots: string[];
  badges: number;
  areaProgress: { bucket: string; done: boolean }[];
}

export function buildUserContext(db: Dataset, user: User): UserContext {
  const programById = new Map(db.programs.map((p) => [p.id, p]));
  const courseProgram = new Map(db.courses.map((c) => [c.id, c.programId]));
  const completed = db.enrollments
    .filter((e) => e.userId === user.id && e.status === "completed")
    .map((e) => programById.get(courseProgram.get(e.courseId)!)?.name)
    .filter((n): n is string => !!n);

  return {
    name: user.name,
    track: TRACK_LABEL[user.track],
    grade: GRADE_LABEL[user.spotGrade],
    spotCount: user.spotCount,
    interests: user.interests,
    completedCourses: [...new Set(completed)],
    recommendedCourses: recommendedPrograms(db, user, 3).map((p) => p.name),
    recommendedSpots: recommendedSpotsForUser(db, user, 3).map((r) => r.job.title),
    badges: userBadges(db, user.id).length,
    areaProgress: userAreaProgress(db, user).map((a) => ({ bucket: a.bucket, done: a.done })),
  };
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export async function callAnthropic(
  apiKey: string,
  context: UserContext,
  history: ChatTurn[],
  query: string
): Promise<string> {
  const messages = [
    ...history.map((t) => ({ role: t.role, content: t.content })),
    {
      role: "user" as const,
      content: `[사용자 컨텍스트] ${JSON.stringify(context)}\n\n[질문] ${query}`,
    },
  ];

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages,
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API ${res.status}`);
  }
  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error("빈 응답");
  return text;
}

// ──────────────────────────────────────────────
// 폴백 (API 키 없음 / 호출 실패 시 규칙 기반 응답)
// ──────────────────────────────────────────────
export interface ChatAction {
  label: string;
  to: string;
}

export function detectAction(query: string): ChatAction | null {
  const q = query.toLowerCase();
  if (q.includes("이수") || q.includes("수강") || q.includes("과목") || q.includes("과정"))
    return { label: "교육과정 보러가기", to: "/courses" };
  if (q.includes("spot") || q.includes("스팟") || q.includes("일감"))
    return { label: "Spot 추천 보기", to: "/spot" };
  if (q.includes("포트폴리오"))
    return { label: "포트폴리오 열기", to: "/me/portfolio" };
  if (q.includes("지원") || q.includes("채용") || q.includes("쿠팡") || q.includes("취업"))
    return { label: "채용공고 보기", to: "/jobs" };
  return null;
}

export function fallbackReply(query: string, ctx: UserContext): string {
  const q = query.toLowerCase();

  if (q.includes("이수") || q.includes("수강") || q.includes("과목") || q.includes("과정")) {
    const incomplete = ctx.areaProgress.filter((a) => !a.done).map((a) => a.bucket);
    return `(현재 상태) ${ctx.name}님은 ${ctx.track} 트랙이며 지금까지 ${ctx.completedCourses.length}개 과정을 이수했습니다.${
      incomplete.length ? ` 아직 ${incomplete.join(", ")} 영역이 남아 있습니다.` : " 3영역 동시이수 요건을 충족했습니다."
    }
(제안) "교양·사회 + AI공통 + 실전·전문 동시이수" 원칙에 따라 남은 영역을 보완하는 것을 권장합니다.
(다음 액션) 추천 과정: ${ctx.recommendedCourses.join(", ") || "추가 추천 없음"}.`;
  }

  if (q.includes("spot") || q.includes("스팟") || q.includes("일감")) {
    return `(현재 상태) ${ctx.grade} 등급, 누적 ${ctx.spotCount}회 수행, 관심사는 ${ctx.interests.join("·")}입니다.
(제안) 등급·위치·관심사를 반영해 적합도가 높은 일감을 골랐습니다.
(다음 액션) 추천 Spot: ${ctx.recommendedSpots.join(", ") || "현재 추천 가능한 일감이 없습니다"}.`;
  }

  if (q.includes("포트폴리오")) {
    return `(현재 상태) 이수 과정 ${ctx.completedCourses.length}개, 디지털 배지 ${ctx.badges}개, Spot ${ctx.spotCount}회의 이력이 집계되어 있습니다.
(제안) 강점은 일경험 누적이며, 보완점은 ${ctx.areaProgress.filter((a) => !a.done).map((a) => a.bucket).join(", ") || "특이사항 없음"} 영역입니다.
(다음 액션) 포트폴리오에서 '공유 카드'를 생성해 협약기업에 어필해 보세요.`;
  }

  if (q.includes("쿠팡") || q.includes("지원") || q.includes("채용") || q.includes("취업")) {
    return `(현재 상태) ${ctx.track} 트랙, 관심사 ${ctx.interests.join("·")} 기준으로 분석했습니다.
(제안) 목표 직무 관련 전문 과정 이수와 일경험 누적이 합격 가능성을 높입니다.
(다음 액션) 협약기업 채용공고에서 매칭 점수가 높은 공고부터 확인해 보세요.`;
  }

  return `(현재 상태) ${ctx.name}님은 ${ctx.track} 트랙 · ${ctx.grade} 등급입니다.
(제안) 이수·Spot·포트폴리오·진로 중 궁금한 주제를 구체적으로 알려주시면 맞춤 안내가 가능합니다.
(다음 액션) 아래 추천 질문을 눌러보시거나, 자세한 정보는 사업단 운영자에게 문의해 주세요.`;
}
