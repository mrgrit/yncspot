import type {
  Badge,
  BadgeLevel,
  Enrollment,
  Program,
  ProgramArea,
} from "@/types";

/**
 * 디지털 배지 발급 로직.
 *   발급 조건: 출석률 80% 이상 AND 점수 60점 이상 (= 이수 기준)
 *   배지 등급(level)은 점수 구간으로 자동 결정.
 */
export function isEligibleForBadge(e: Pick<Enrollment, "attendanceRate" | "score">): boolean {
  return e.attendanceRate >= 80 && e.score >= 60;
}

export function resolveBadgeLevel(score: number): BadgeLevel {
  if (score >= 90) return "platinum";
  if (score >= 80) return "gold";
  if (score >= 70) return "silver";
  return "bronze";
}

export const CERT_BASE_URL = "https://cert.mock.abeek.or.kr/badge"; // 한국공학교육인증원 Mock

export function buildCertUrl(badgeId: string): string {
  return `${CERT_BASE_URL}/${badgeId}`;
}

const AREA_BADGE_NAME: Record<ProgramArea, string> = {
  social: "사회역량 배지",
  liberal: "교양역량 배지",
  ai_common: "AI 공통역량 배지",
  professional: "실전·전문역량 배지",
};

/** 이수한 수강 1건 → 배지 1건 발급 (조건 충족 시) */
export function issueBadgeForEnrollment(
  enrollment: Enrollment,
  program: Program | undefined,
  id: string,
  issuedAt: string
): Badge | null {
  if (!isEligibleForBadge(enrollment)) return null;

  const isCapstone = program?.type === "capstone";
  const name = isCapstone
    ? "캡스톤 수료 배지"
    : program
      ? AREA_BADGE_NAME[program.area]
      : "이수 배지";

  return {
    id,
    userId: enrollment.userId,
    type: isCapstone ? "capstone" : "course_completion",
    level: resolveBadgeLevel(enrollment.score),
    name,
    programId: program?.id,
    issuedAt,
    certUrl: buildCertUrl(id),
  };
}
