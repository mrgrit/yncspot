import type { BonusType, SpotGrade } from "@/types";

/**
 * Spot Work 단계별 보상 계산.
 *   1차 성공 → 교통비(정액 5,000원)
 *   2차 성공 → ½ 일당
 *   3차 성공 → 일당 전액
 *   그 외(4회차+) → 보너스 없음 (기본 일당만 지급)
 *
 * "성공 차수(sequence)"는 개인의 누적 Spot 성공 순서를 의미한다.
 */
export interface RewardResult {
  type: BonusType;
  amount: number;
}

export const TRANSPORT_BONUS = 5000;

export function calcReward(
  baseWage: number,
  sequence: 1 | 2 | 3 | null
): RewardResult {
  if (sequence === 1) return { type: "transport", amount: TRANSPORT_BONUS };
  if (sequence === 2) return { type: "half", amount: Math.round(baseWage / 2) };
  if (sequence === 3) return { type: "full", amount: baseWage };
  return { type: null, amount: 0 };
}

/** 실제 지급 총액 = 기본 일당 + 보너스 */
export function calcTotalPaid(
  baseWage: number,
  sequence: 1 | 2 | 3 | null
): { bonusType: BonusType; bonusAmount: number; totalPaid: number } {
  const { type, amount } = calcReward(baseWage, sequence);
  return { bonusType: type, bonusAmount: amount, totalPaid: baseWage + amount };
}

// ──────────────────────────────────────────────
// 등급 승급 룰 엔진 (누적 횟수 + 평균 평점)
// ──────────────────────────────────────────────
export const GRADE_RULES: {
  grade: SpotGrade;
  minCount: number;
  minRating: number;
}[] = [
  { grade: "platinum", minCount: 20, minRating: 4.5 },
  { grade: "gold", minCount: 10, minRating: 4.2 },
  { grade: "silver", minCount: 5, minRating: 3.8 },
  { grade: "bronze", minCount: 0, minRating: 0 },
];

/** 누적 수행횟수와 평균 평점으로 등급을 산정한다. */
export function resolveGrade(count: number, avgRating: number): SpotGrade {
  for (const rule of GRADE_RULES) {
    if (count >= rule.minCount && avgRating >= rule.minRating) {
      return rule.grade;
    }
  }
  return "bronze";
}

export const GRADE_ORDER: SpotGrade[] = ["bronze", "silver", "gold", "platinum"];

/** 다음 등급까지 남은 횟수(대략) — 마이페이지 진척 표시용 */
export function nextGradeProgress(grade: SpotGrade, count: number) {
  const idx = GRADE_ORDER.indexOf(grade);
  if (idx === GRADE_ORDER.length - 1) {
    return { next: null as SpotGrade | null, remaining: 0 };
  }
  const next = GRADE_ORDER[idx + 1];
  const rule = GRADE_RULES.find((r) => r.grade === next)!;
  return { next, remaining: Math.max(0, rule.minCount - count) };
}
