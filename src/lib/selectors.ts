/**
 * 더미 데이터에서 화면용 지표를 집계하는 순수 셀렉터 모음.
 * 페이지는 useMemo 로 감싸 사용한다.
 */
import type {
  Badge,
  Company,
  Dataset,
  Enrollment,
  JobPosting,
  Portfolio,
  Program,
  ProgramArea,
  SpotGrade,
  SpotHistory,
  SpotJob,
  User,
} from "@/types";
import { THEME } from "@/config/brand";
import { nextGradeProgress } from "@/lib/reward";
import {
  recommendSpots,
  scoreMatch,
  setJobEmployerResolver,
  type MatchResult,
} from "@/lib/matcher";

export const NOW = new Date("2026-05-26T12:00:00.000Z");

export const MONTHS = [
  { key: "2026-01", label: "1월" },
  { key: "2026-02", label: "2월" },
  { key: "2026-03", label: "3월" },
  { key: "2026-04", label: "4월" },
  { key: "2026-05", label: "5월" },
];

const monthKey = (iso?: string) => (iso ? iso.slice(0, 7) : "");

// 매칭기 jobId→employerId resolver 1회 설정
let resolverDb: Dataset | null = null;
function ensureResolver(db: Dataset) {
  if (resolverDb === db) return;
  const map = new Map(db.spotJobs.map((j) => [j.id, j.employerId]));
  setJobEmployerResolver((jobId) => map.get(jobId));
  resolverDb = db;
}

// ──────────────────────────────────────────────
// 월별 활동 시계열
// ──────────────────────────────────────────────
export interface MonthlyRow {
  key: string;
  label: string;
  signups: number;
  spots: number;
  completions: number;
  hired: number;
  cumSignups: number;
  cumHired: number;
  avgRating: number;
}

export function monthlyActivity(db: Dataset): MonthlyRow[] {
  let cumSignups = 0;
  let cumHired = 0;
  return MONTHS.map((m) => {
    const signups = db.users.filter((u) => monthKey(u.joinedAt) === m.key).length;
    const spots = db.spotHistory.filter((h) => monthKey(h.completedAt) === m.key);
    const completions = db.enrollments.filter(
      (e) => e.status === "completed" && monthKey(e.completedAt) === m.key
    ).length;
    const hired = db.placements.filter(
      (p) => p.status === "hired" && monthKey(p.hiredAt) === m.key
    ).length;
    cumSignups += signups;
    cumHired += hired;
    const avgRating =
      spots.length > 0
        ? spots.reduce((s, h) => s + h.rating, 0) / spots.length
        : 0;
    return {
      key: m.key,
      label: m.label,
      signups,
      spots: spots.length,
      completions,
      hired,
      cumSignups,
      cumHired,
      avgRating: Number(avgRating.toFixed(2)),
    };
  });
}

// ──────────────────────────────────────────────
// 대시보드 KPI
// ──────────────────────────────────────────────
export interface DashboardKpis {
  trained: number;
  trainedTarget: number;
  active: number;
  employRate: number;
  employed: number;
  spotTotal: number;
  spotThisMonth: number;
  hired: number;
  satisfaction: number;
  satisfactionCount: number;
}

export function dashboardKpis(db: Dataset): DashboardKpis {
  const trained = db.users.filter((u) =>
    ["spot_active", "enrolled", "completed", "employed"].includes(u.status)
  ).length;

  const activeSince = new Date(NOW.getTime() - 30 * 86400000).getTime();
  const active = db.users.filter(
    (u) => new Date(u.lastActiveAt).getTime() >= activeSince
  ).length;

  // 취업률은 '수료생(이수완료/취업)' 을 분모로 산정 (Get 트랙)
  const getGrads = db.users.filter(
    (u) => u.track === "get_job" && (u.status === "completed" || u.status === "employed")
  );
  const getEmployedGrads = getGrads.filter((u) => u.status === "employed").length;
  const employed = db.users.filter((u) => u.status === "employed").length;

  const ratings = [
    ...db.spotHistory.map((h) => h.rating),
    ...db.mentorships.map((m) => m.rating),
  ];
  const satisfaction =
    ratings.reduce((s, r) => s + r, 0) / Math.max(1, ratings.length);

  return {
    trained,
    trainedTarget: 200,
    active,
    employRate: getGrads.length ? (getEmployedGrads / getGrads.length) * 100 : 0,
    employed,
    spotTotal: db.spotHistory.length,
    spotThisMonth: db.spotHistory.filter(
      (h) => monthKey(h.completedAt) === "2026-05"
    ).length,
    hired: db.placements.filter((p) => p.status === "hired").length,
    satisfaction: Number(satisfaction.toFixed(2)),
    satisfactionCount: ratings.length,
  };
}

// ──────────────────────────────────────────────
// 트랙 분포 / 등급 분포
// ──────────────────────────────────────────────
export function trackDistribution(db: Dataset) {
  const tryN = db.users.filter((u) => u.track === "try_job").length;
  const getN = db.users.filter((u) => u.track === "get_job").length;
  return [
    { name: "Try Job", value: tryN, color: THEME.trackTryJob },
    { name: "Get Job", value: getN, color: THEME.trackGetJob },
  ];
}

export function gradeByMonth(db: Dataset) {
  return MONTHS.map((m) => {
    const cohort = db.users.filter((u) => monthKey(u.joinedAt) === m.key);
    const count = (g: SpotGrade) => cohort.filter((u) => u.spotGrade === g).length;
    return {
      label: m.label,
      bronze: count("bronze"),
      silver: count("silver"),
      gold: count("gold"),
      platinum: count("platinum"),
    };
  });
}

// ──────────────────────────────────────────────
// 프로그램별 이수율
// ──────────────────────────────────────────────
export function programCompletionRates(db: Dataset) {
  const courseProgram = new Map(db.courses.map((c) => [c.id, c.programId]));
  return db.programs
    .map((p) => {
      const courseIds = new Set(
        db.courses.filter((c) => c.programId === p.id).map((c) => c.id)
      );
      const enr = db.enrollments.filter((e) => courseIds.has(e.courseId));
      void courseProgram;
      const completed = enr.filter((e) => e.status === "completed").length;
      const total = enr.length;
      return {
        id: p.id,
        name: p.name,
        track: p.track,
        completed,
        total,
        rate: total ? Math.round((completed / total) * 100) : 0,
      };
    })
    .sort((a, b) => b.rate - a.rate);
}

// ──────────────────────────────────────────────
// 협약기업 채용 활동
// ──────────────────────────────────────────────
export function companyHiringActivity(db: Dataset, limit = 8) {
  const byCompany = new Map<string, { matched: number; hired: number }>();
  for (const p of db.placements) {
    const e = byCompany.get(p.companyId) ?? { matched: 0, hired: 0 };
    e.matched += 1;
    if (p.status === "hired") e.hired += 1;
    byCompany.set(p.companyId, e);
  }
  return db.companies
    .map((c) => {
      const e = byCompany.get(c.id) ?? { matched: 0, hired: 0 };
      return {
        id: c.id,
        name: c.name,
        matched: e.matched,
        hired: e.hired,
        ratio: e.matched ? Math.round((e.hired / e.matched) * 100) : 0,
      };
    })
    .sort((a, b) => b.matched - a.matched || b.hired - a.hired)
    .slice(0, limit);
}

// ──────────────────────────────────────────────
// 최근 활동 피드
// ──────────────────────────────────────────────
export interface ActivityEvent {
  id: string;
  type: "signup" | "spot" | "course" | "placement" | "badge";
  text: string;
  at: string;
}

export function recentActivity(db: Dataset, limit = 30): ActivityEvent[] {
  const userName = new Map(db.users.map((u) => [u.id, u.name]));
  const jobTitle = new Map(db.spotJobs.map((j) => [j.id, j.title]));
  const companyName = new Map(db.companies.map((c) => [c.id, c.name]));
  const programByCourse = new Map<string, Program>();
  const programById = new Map(db.programs.map((p) => [p.id, p]));
  for (const c of db.courses)
    programByCourse.set(c.id, programById.get(c.programId)!);

  const events: ActivityEvent[] = [];
  for (const u of db.users)
    events.push({ id: `s-${u.id}`, type: "signup", text: `${u.name}님이 가입했습니다`, at: u.joinedAt });
  for (const h of db.spotHistory)
    events.push({
      id: `sp-${h.id}`,
      type: "spot",
      text: `${userName.get(h.userId) ?? "참여자"}님이 '${jobTitle.get(h.jobId) ?? "Spot"}'을(를) 완료했습니다`,
      at: h.completedAt,
    });
  for (const e of db.enrollments)
    if (e.status === "completed" && e.completedAt)
      events.push({
        id: `c-${e.id}`,
        type: "course",
        text: `${userName.get(e.userId) ?? "참여자"}님이 '${programByCourse.get(e.courseId)?.name ?? "과정"}'을(를) 이수했습니다`,
        at: e.completedAt,
      });
  for (const p of db.placements)
    if (p.status === "hired" && p.hiredAt)
      events.push({
        id: `p-${p.id}`,
        type: "placement",
        text: `${userName.get(p.userId) ?? "참여자"}님이 ${companyName.get(p.companyId) ?? "기업"}에 채용 확정되었습니다`,
        at: p.hiredAt,
      });

  return events
    .filter((e) => e.at)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);
}

// ──────────────────────────────────────────────
// 사용자(youth) 개인 집계
// ──────────────────────────────────────────────
export function userEnrollments(db: Dataset, userId: string): Enrollment[] {
  return db.enrollments.filter((e) => e.userId === userId);
}

export function userSpotHistory(db: Dataset, userId: string): SpotHistory[] {
  return db.spotHistory
    .filter((h) => h.userId === userId)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
}

export function userBadges(db: Dataset, userId: string): Badge[] {
  return db.badges.filter((b) => b.userId === userId);
}

export function userPortfolio(db: Dataset, userId: string): Portfolio | undefined {
  return db.portfolios.find((p) => p.userId === userId);
}

/** 3영역(교양·사회 / AI공통 / 전문) 동시이수 진척 */
export interface AreaProgress {
  bucket: string;
  areas: ProgramArea[];
  completed: number;
  total: number;
  done: boolean;
}

const AREA_BUCKETS: { bucket: string; areas: ProgramArea[] }[] = [
  { bucket: "교양·사회", areas: ["liberal", "social"] },
  { bucket: "AI공통", areas: ["ai_common"] },
  { bucket: "실전·전문", areas: ["professional"] },
];

export function userAreaProgress(db: Dataset, user: User): AreaProgress[] {
  const programById = new Map(db.programs.map((p) => [p.id, p]));
  const courseProgram = new Map(db.courses.map((c) => [c.id, c.programId]));
  const enr = userEnrollments(db, user.id);

  const programsByArea = (areas: ProgramArea[]) =>
    new Set(
      enr
        .map((e) => programById.get(courseProgram.get(e.courseId)!))
        .filter((p): p is Program => !!p && p.track === user.track && areas.includes(p.area))
        .map((p) => p.id)
    );
  const completedProgramsByArea = (areas: ProgramArea[]) =>
    new Set(
      enr
        .filter((e) => e.status === "completed")
        .map((e) => programById.get(courseProgram.get(e.courseId)!))
        .filter((p): p is Program => !!p && p.track === user.track && areas.includes(p.area))
        .map((p) => p.id)
    );

  return AREA_BUCKETS.map(({ bucket, areas }) => {
    const total = Math.max(1, programsByArea(areas).size);
    const completed = completedProgramsByArea(areas).size;
    return { bucket, areas, completed, total, done: completed >= 1 };
  });
}

/** 다음 추천 과목 (미이수 + 트랙 일치, 미완료 영역 우선) */
export function recommendedPrograms(db: Dataset, user: User, n = 3): Program[] {
  const programById = new Map(db.programs.map((p) => [p.id, p]));
  const courseProgram = new Map(db.courses.map((c) => [c.id, c.programId]));
  const enr = userEnrollments(db, user.id);
  const enrolledPrograms = new Set(
    enr.map((e) => courseProgram.get(e.courseId)!)
  );
  const completedPrograms = new Set(
    enr
      .filter((e) => e.status === "completed")
      .map((e) => courseProgram.get(e.courseId)!)
  );
  void programById;

  const progress = userAreaProgress(db, user);
  const incompleteAreas = new Set(
    progress.filter((p) => !p.done).flatMap((p) => p.areas)
  );

  return db.programs
    .filter((p) => p.track === user.track && !completedPrograms.has(p.id))
    .map((p) => ({
      p,
      priority:
        (incompleteAreas.has(p.area) ? 0 : 1) +
        (enrolledPrograms.has(p.id) ? 0.5 : 0),
    }))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, n)
    .map((x) => x.p);
}

export function gradeProgress(user: User) {
  return nextGradeProgress(user.spotGrade, user.spotCount);
}

// ──────────────────────────────────────────────
// Spot 매칭 (사용자 관점)
// ──────────────────────────────────────────────
export function matchForUser(db: Dataset, user: User, job: SpotJob): MatchResult {
  ensureResolver(db);
  const employer = db.employers.find((e) => e.id === job.employerId);
  return scoreMatch(user, job, employer, db.spotHistory);
}

export function recommendedSpotsForUser(db: Dataset, user: User, limit = 3) {
  ensureResolver(db);
  return recommendSpots(user, db.spotJobs, db.employers, db.spotHistory, limit);
}

// ──────────────────────────────────────────────
// 채용공고 매칭 (관심사 ↔ 매칭학과)
// ──────────────────────────────────────────────
export function jobMatchScore(user: User, company: Company, _posting: JobPosting): number {
  const hay = (company.matchedDepartments.join(" ") + " " + company.industry).toLowerCase();
  let score = 40; // 기본
  for (const it of user.interests) {
    if (hay.includes(it.toLowerCase())) score += 20;
  }
  return Math.min(100, score);
}

// ──────────────────────────────────────────────
// 포트폴리오용 학습/Spot 요약
// ──────────────────────────────────────────────
export function learningSummary(db: Dataset, userId: string) {
  const programById = new Map(db.programs.map((p) => [p.id, p]));
  const courseProgram = new Map(db.courses.map((c) => [c.id, c.programId]));
  const completed = userEnrollments(db, userId).filter(
    (e) => e.status === "completed"
  );
  const hours = completed.reduce((s, e) => {
    const prog = programById.get(courseProgram.get(e.courseId)!);
    return s + (prog?.hours ?? 0);
  }, 0);
  const avgScore =
    completed.length > 0
      ? completed.reduce((s, e) => s + e.score, 0) / completed.length
      : 0;
  return {
    completedCount: completed.length,
    hours,
    avgScore: Number(avgScore.toFixed(1)),
  };
}

export function spotByCategory(db: Dataset, userId: string) {
  const jobCat = new Map(db.spotJobs.map((j) => [j.id, j.category]));
  const byCat = new Map<string, { count: number; paid: number }>();
  for (const h of db.spotHistory.filter((x) => x.userId === userId)) {
    const cat = jobCat.get(h.jobId) ?? "기타";
    const e = byCat.get(cat) ?? { count: 0, paid: 0 };
    e.count += 1;
    e.paid += h.totalPaid;
    byCat.set(cat, e);
  }
  return [...byCat.entries()]
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.count - a.count);
}

// ──────────────────────────────────────────────
// 협약기업 통계 / 보고서
// ──────────────────────────────────────────────
export function companyStats(db: Dataset, companyId: string) {
  const postings = db.jobPostings.filter((j) => j.companyId === companyId);
  const placements = db.placements.filter((p) => p.companyId === companyId);
  const hired = placements.filter((p) => p.status === "hired").length;
  const mentorships = db.mentorships.filter((m) => m.companyId === companyId).length;
  return {
    postings: postings.length,
    applicants: postings.reduce((s, p) => s + p.applicantCount, 0),
    matched: placements.length,
    hired,
    mentorships,
  };
}

// ──────────────────────────────────────────────
// 수료생 (사후 관리 / 인재풀)
// ──────────────────────────────────────────────
export function graduates(db: Dataset): User[] {
  return db.users.filter(
    (u) => u.status === "completed" || u.status === "employed"
  );
}

export interface GraduateRow {
  user: User;
  completedCount: number;
  hours: number;
  badges: number;
  capstone?: string;
  employed: boolean;
  companyName?: string;
}

export function graduateRows(db: Dataset): GraduateRow[] {
  const pf = new Map(db.portfolios.map((p) => [p.userId, p]));
  const companyById = new Map(db.companies.map((c) => [c.id, c]));
  return graduates(db).map((u) => {
    const learn = learningSummary(db, u.id);
    const cap = pf.get(u.id)?.projects.find((x) => x.kind === "capstone")?.title;
    const placement = db.placements.find(
      (pl) => pl.userId === u.id && pl.status === "hired"
    );
    return {
      user: u,
      completedCount: learn.completedCount,
      hours: learn.hours,
      badges: userBadges(db, u.id).length,
      capstone: cap,
      employed: u.status === "employed",
      companyName: placement ? companyById.get(placement.companyId)?.name : undefined,
    };
  });
}

export function graduateOutcomes(db: Dataset) {
  const grads = graduates(db);
  const employed = grads.filter((g) => g.status === "employed").length;
  const count = (t: "try_job" | "get_job") => {
    const list = grads.filter((g) => g.track === t);
    const emp = list.filter((g) => g.status === "employed").length;
    return {
      total: list.length,
      employed: emp,
      rate: list.length ? Math.round((emp / list.length) * 100) : 0,
    };
  };
  return {
    total: grads.length,
    employed,
    employRate: grads.length ? Math.round((employed / grads.length) * 100) : 0,
    capstoneDone: db.portfolios.filter((p) =>
      p.projects.some((x) => x.kind === "capstone")
    ).length,
    byTrack: { try_job: count("try_job"), get_job: count("get_job") },
  };
}

// ──────────────────────────────────────────────
// 상담 내역 (사업단·본인 전용) / 쉬었음 청년 비율
// ──────────────────────────────────────────────
export function userCounselings(db: Dataset, userId: string) {
  return db.counselings
    .filter((c) => c.userId === userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function restedRatio(db: Dataset) {
  const rested = db.users.filter((u) => u.rested).length;
  const total = db.users.length;
  return { rested, total, pct: total ? Math.round((rested / total) * 100) : 0 };
}

export function reportFigures(db: Dataset) {
  const k = dashboardKpis(db);
  const completionRate =
    db.enrollments.length > 0
      ? Math.round(
          (db.enrollments.filter((e) => e.status === "completed").length /
            db.enrollments.length) *
            100
        )
      : 0;
  const dropoutRate =
    db.enrollments.length > 0
      ? Math.round(
          (db.enrollments.filter((e) => e.status === "dropped").length /
            db.enrollments.length) *
            100
        )
      : 0;
  return {
    trained: k.trained,
    completionRate,
    dropoutRate,
    employRate: Number(k.employRate.toFixed(1)),
    spotTotal: k.spotTotal,
    hired: k.hired,
    satisfaction: k.satisfaction,
  };
}
