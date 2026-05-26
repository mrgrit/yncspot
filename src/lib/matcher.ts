import type { Employer, SpotGrade, SpotHistory, SpotJob, User } from "@/types";
import { GRADE_ORDER } from "@/lib/reward";

/**
 * Spot 매칭 점수 계산 (최대 100점).
 *   등급 충족        +30  (보유 등급 >= 요구 등급)
 *   카테고리=관심사  +25
 *   거리 가까움      +20  (발주처 지역 == 사용자 거주 지역)
 *   과거 동일 발주처 +15
 *   발주처 평점 4.5+ +10
 */
export interface MatchBreakdown {
  grade: number;
  interest: number;
  distance: number;
  repeatEmployer: number;
  rating: number;
}

export interface MatchResult {
  score: number;
  breakdown: MatchBreakdown;
  reasons: string[];
}

const W = {
  grade: 30,
  interest: 25,
  distance: 20,
  repeatEmployer: 15,
  rating: 10,
} as const;

function gradeMeets(userGrade: SpotGrade, required: SpotGrade): boolean {
  return GRADE_ORDER.indexOf(userGrade) >= GRADE_ORDER.indexOf(required);
}

/** 주소/지역 문자열에서 핵심 지역명 토큰 추출 */
export const KNOWN_DISTRICTS = [
  "남구",
  "해운대",
  "서면",
  "부산진구",
  "수영구",
  "동구",
  "연제구",
];

export function districtOf(addr: string): string | null {
  return KNOWN_DISTRICTS.find((d) => addr.includes(d)) ?? null;
}

export function scoreMatch(
  user: User,
  job: SpotJob,
  employer: Employer | undefined,
  history: SpotHistory[]
): MatchResult {
  const breakdown: MatchBreakdown = {
    grade: 0,
    interest: 0,
    distance: 0,
    repeatEmployer: 0,
    rating: 0,
  };
  const reasons: string[] = [];

  if (gradeMeets(user.spotGrade, job.requiredGrade)) {
    breakdown.grade = W.grade;
    reasons.push("등급 충족");
  }

  if (user.interests.some((i) => job.category.includes(i) || i.includes(job.category))) {
    breakdown.interest = W.interest;
    reasons.push("관심 분야 일치");
  }

  const userDistrict = districtOf(user.address);
  if (userDistrict && (job.location.includes(userDistrict) || employer?.district === userDistrict)) {
    breakdown.distance = W.distance;
    reasons.push("가까운 위치");
  }

  const didEmployerBefore = history.some(
    (h) => h.userId === user.id && jobBelongsToEmployer(h.jobId, job.employerId)
  );
  if (didEmployerBefore) {
    breakdown.repeatEmployer = W.repeatEmployer;
    reasons.push("이전 수행 발주처");
  }

  if (employer && employer.rating >= 4.5) {
    breakdown.rating = W.rating;
    reasons.push("발주처 평판 우수");
  }

  const score =
    breakdown.grade +
    breakdown.interest +
    breakdown.distance +
    breakdown.repeatEmployer +
    breakdown.rating;

  return { score, breakdown, reasons };
}

// history 는 jobId 만 가지므로, 동일 발주처 판별은 호출부에서 jobId→employerId 매핑이 필요하다.
// 매칭기 단독 사용을 위해 가벼운 휴리스틱 훅을 둔다(런타임에 주입 가능).
let jobEmployerResolver: (jobId: string) => string | undefined = () => undefined;
export function setJobEmployerResolver(fn: (jobId: string) => string | undefined) {
  jobEmployerResolver = fn;
}
function jobBelongsToEmployer(jobId: string, employerId: string): boolean {
  return jobEmployerResolver(jobId) === employerId;
}

/** 사용자에게 추천할 Spot 일감 상위 N개 (모집중인 것 중) */
export function recommendSpots(
  user: User,
  jobs: SpotJob[],
  employers: Employer[],
  history: SpotHistory[],
  limit = 3
): { job: SpotJob; match: MatchResult }[] {
  const empById = new Map(employers.map((e) => [e.id, e]));
  return jobs
    .filter((j) => j.status === "open")
    .map((job) => ({
      job,
      match: scoreMatch(user, job, empById.get(job.employerId), history),
    }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, limit);
}
