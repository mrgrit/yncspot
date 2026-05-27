/**
 * 참여자(User) 200명 생성.
 * 트랙별 status 분포는 기획서 §4 더미 명세를 그대로 반영한다.
 *   Try Job 140: spot_active 60 / enrolled 50 / completed 25 / dropped 5
 *   Get Job  60: registered 5 / enrolled 25 / completed 20 / employed 10
 * (employed 는 이후 seed.ts 의 Placement 동기화 단계에서 최종 확정될 수 있음)
 */
import type { SpotGrade, Track, User, UserStatus } from "@/types";
import {
  AVATAR_COLORS,
  DAEGU_ADDRESSES,
  DEPARTMENTS,
  GIVEN_NAMES,
  GOALS,
  SKILLS,
  SURNAMES,
  INTERESTS,
  SITUATIONS_TRY,
  SITUATIONS_GET,
  STORY_BY_SITUATION,
  MOTIVATION_TEMPLATES,
  chance,
  idFactory,
  int,
  isoDate,
  pick,
  picks,
  weightedSignupDate,
  weighted,
  dateBetween,
  iso,
} from "./pools";

interface StatusPlan {
  track: Track;
  status: UserStatus;
}

function buildStatusPlan(): StatusPlan[] {
  const plan: StatusPlan[] = [];
  const add = (track: Track, status: UserStatus, n: number) => {
    for (let i = 0; i < n; i++) plan.push({ track, status });
  };
  // Try Job 140
  add("try_job", "spot_active", 60);
  add("try_job", "enrolled", 50);
  add("try_job", "completed", 25);
  add("try_job", "dropped", 5);
  // Get Job 60
  add("get_job", "registered", 5);
  add("get_job", "enrolled", 25);
  add("get_job", "completed", 20);
  add("get_job", "employed", 10);
  return plan;
}

const GRADE_WEIGHTS: { weight: number; value: SpotGrade }[] = [
  { weight: 50, value: "bronze" },
  { weight: 30, value: "silver" },
  { weight: 15, value: "gold" },
  { weight: 5, value: "platinum" },
];

/** 등급별 누적 Spot 수행 횟수 범위 (resolveGrade 규칙과 정합) */
function spotCountForGrade(grade: SpotGrade): number {
  switch (grade) {
    case "platinum":
      return int(20, 32);
    case "gold":
      return int(10, 16);
    case "silver":
      return int(5, 8);
    default:
      return int(1, 4);
  }
}

function uniqueName(used: Set<string>): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    const name = `${pick(SURNAMES)}${pick(GIVEN_NAMES)}`;
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
  // 충돌 시 접미 숫자
  const fallback = `${pick(SURNAMES)}${pick(GIVEN_NAMES)}${used.size}`;
  used.add(fallback);
  return fallback;
}

function romanize(id: string): string {
  return id.replace("_", "");
}

export function buildUsers(): User[] {
  const nextId = idFactory("usr");
  const plan = buildStatusPlan();
  const usedNames = new Set<string>();

  return plan.map(({ track, status }) => {
    const id = nextId();
    const name = uniqueName(usedNames);

    const grade: SpotGrade =
      status === "registered" ? "bronze" : weighted(GRADE_WEIGHTS);
    const spotCount =
      status === "registered" ? int(0, 2) : spotCountForGrade(grade);

    const joined = weightedSignupDate();
    const lastActive = dateBetween(iso(joined), "2026-05-25T20:00:00.000Z");

    // 진척이 있는 사용자일수록 외부 시스템 연동 완료율이 높음
    const advanced =
      status === "enrolled" ||
      status === "completed" ||
      status === "employed";
    const naisP = advanced ? 0.95 : status === "spot_active" ? 0.5 : 0.2;
    const govP = advanced ? 0.9 : status === "spot_active" ? 0.55 : 0.35;
    const gov24_assessed = chance(govP);

    const dept = pick(DEPARTMENTS);
    const major = dept.replace(/과$/, "");
    const goal = pick(GOALS);
    const skills = picks(SKILLS, int(2, 5));
    const interests = picks(INTERESTS, int(1, 3));
    const bio = `${dept} 출신으로 ${goal} 직무를 목표로 합니다. 현장형 일경험과 교육을 병행하고 있습니다.`;

    // 페르소나
    const sit = weighted(track === "try_job" ? SITUATIONS_TRY : SITUATIONS_GET);
    const storyIntro = pick(
      STORY_BY_SITUATION[sit.label] ?? ["진로를 고민하며 새로운 도전을 준비합니다."]
    );
    const story = `${storyIntro} 이제 ${interests[0]} 분야에서 ${goal}(으)로 도약하려 합니다.`;
    const motivation = pick(MOTIVATION_TEMPLATES);

    return {
      id,
      name,
      email: `${romanize(id)}@jump-spot.kr`,
      phone: `010-${int(2000, 9999)}-${int(1000, 9999)}`,
      birthDate: isoDate(dateBetween("1992-01-01", "2008-12-31")),
      gender: chance(0.52) ? "male" : "female",
      address: pick(DAEGU_ADDRESSES),
      track,
      status,
      spotGrade: grade,
      spotCount,
      nais_registered: chance(naisP),
      gov24_assessed,
      gov24_score: gov24_assessed ? int(45, 95) : undefined,
      interests,
      school: dept,
      major,
      goal,
      skills,
      bio,
      situation: sit.label,
      rested: sit.rested,
      story,
      motivation,
      joinedAt: iso(joined),
      lastActiveAt: iso(lastActive),
      avatarColor: pick(AVATAR_COLORS),
    };
  });
}
