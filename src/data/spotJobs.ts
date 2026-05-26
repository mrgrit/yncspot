/**
 * Spot 발주처(35) · Spot 일감(580) 생성.
 *   발주처: 카페 12 / 매장 8 / 행사대행 6 / 물류 5 / 데이터입력 4
 *   일감 status: 완료 400 / 진행중 50 / 모집중 130
 */
import type { Employer, SpotGrade, SpotJob, SpotJobStatus } from "@/types";
import {
  EMPLOYER_DISTRICTS,
  EMPLOYER_NAME_PARTS,
  SPOT_CATEGORY_BY_EMPLOYER,
  SPOT_JOB_TITLES,
  float,
  idFactory,
  int,
  iso,
  pick,
  weighted,
  weightedSignupDate,
  dateBetween,
} from "./pools";

const EMPLOYER_CATEGORY_COUNTS: { category: string; count: number; suffix: string }[] = [
  { category: "카페", count: 12, suffix: "카페" },
  { category: "매장", count: 8, suffix: "스토어" },
  { category: "행사대행", count: 6, suffix: "이벤트" },
  { category: "물류", count: 5, suffix: "물류" },
  { category: "데이터입력", count: 4, suffix: "데이터" },
];

export function buildEmployers(): Employer[] {
  const nextId = idFactory("emp");
  const employers: Employer[] = [];
  const usedNames = new Set<string>();

  for (const { category, count, suffix } of EMPLOYER_CATEGORY_COUNTS) {
    const parts = EMPLOYER_NAME_PARTS[category];
    for (let i = 0; i < count; i++) {
      const district = EMPLOYER_DISTRICTS[i % EMPLOYER_DISTRICTS.length];
      let name = `${parts[i % parts.length]} ${suffix}`;
      let dedup = 1;
      while (usedNames.has(name)) {
        name = `${parts[i % parts.length]} ${suffix} ${++dedup}호점`;
      }
      usedNames.add(name);
      employers.push({
        id: nextId(),
        name,
        category,
        district,
        contactPerson: `${name} 점주`,
        rating: float(3.8, 5.0, 1),
      });
    }
  }
  return employers;
}

const GRADE_REQ_WEIGHTS: { weight: number; value: SpotGrade }[] = [
  { weight: 60, value: "bronze" },
  { weight: 25, value: "silver" },
  { weight: 12, value: "gold" },
  { weight: 3, value: "platinum" },
];

function buildStatusPool(): SpotJobStatus[] {
  const pool: SpotJobStatus[] = [];
  for (let i = 0; i < 400; i++) pool.push("completed");
  for (let i = 0; i < 50; i++) pool.push("in_progress");
  for (let i = 0; i < 130; i++) pool.push("open");
  return pool; // 합계 580
}

export function buildSpotJobs(employers: Employer[]): SpotJob[] {
  const nextId = idFactory("spot");
  const statusPool = buildStatusPool();

  return statusPool.map((status) => {
    const employer = pick(employers);
    const category = SPOT_CATEGORY_BY_EMPLOYER[employer.category];
    const title = pick(SPOT_JOB_TITLES[category]);
    const durationMin = pick([180, 240, 300, 360, 420, 480]);
    // 기존 40~90k 대비 약 2/3~3/4 수준으로 하향 (대구 단기 일감 현실화)
    const baseWage = int(28, 63) * 1000;
    const created = weightedSignupDate();
    const scheduled = dateBetween(iso(created), "2026-06-10T09:00:00.000Z");

    return {
      id: nextId(),
      employerId: employer.id,
      title,
      description: `${employer.name}에서 진행하는 '${title}' 단기 일감입니다. ${Math.round(
        durationMin / 60
      )}시간 내외 근무.`,
      category,
      durationMin,
      baseWage,
      requiredGrade: weighted(GRADE_REQ_WEIGHTS),
      location: `대구광역시 ${employer.district} 일원`,
      status,
      createdAt: iso(created),
      scheduledAt: iso(scheduled),
    };
  });
}
