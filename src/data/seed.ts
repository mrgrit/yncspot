/**
 * 더미 데이터 생성기 (결정론적, faker.seed(42)).
 * 모든 엔티티를 정해진 순서로 생성하여 cross-reference 무결성을 보장한다.
 *
 * ⚠️ 운영처럼 보이게 만든 가상 데이터입니다. 실제 인물/기업/협약과 무관합니다.
 *
 * 기획서 충돌 지점에 대한 구현 결정:
 *  - successSequence: 개인의 첫 1·2·3번째 Spot 성공 = seq 1/2/3, 그 이후 null (reward 엔진과 정합)
 *  - 채용(Placement): Placement 를 단일 진실원본으로 삼아 hired → User.status='employed' 동기화
 *  - SpotHistory 총건수 = Σ user.spotCount (등급 분포 기반, 약 1,200~1,300건)
 */
import type {
  Badge,
  BadgeLevel,
  ChatMessage,
  ChatSession,
  Company,
  Course,
  Dataset,
  Enrollment,
  EnrollmentStatus,
  JobPosting,
  Mentor,
  Mentorship,
  Notification,
  NotificationType,
  Placement,
  PlacementStatus,
  Portfolio,
  PortfolioProject,
  Program,
  SpotHistory,
  SpotJob,
  User,
  UserStatus,
} from "@/types";
import {
  CHAT_SAMPLES,
  GIVEN_NAMES,
  MENTORING_TOPICS,
  SPOT_FEEDBACKS,
  SURNAMES,
  chance,
  dateBetween,
  faker,
  float,
  idFactory,
  int,
  iso,
  isoDate,
  pick,
  picks,
  weighted,
} from "./pools";
import { calcTotalPaid } from "@/lib/reward";
import {
  buildCertUrl,
  isEligibleForBadge,
  issueBadgeForEnrollment,
} from "@/lib/badgeIssuer";
import { GRADE_LABEL, TRACK_LABEL } from "@/lib/utils";
import { buildUsers } from "./users";
import {
  buildCourses,
  buildInstructors,
  buildPrograms,
} from "./courses";
import { buildCompanies } from "./companies";
import { buildEmployers, buildSpotJobs } from "./spotJobs";

const NOW = new Date("2026-05-25T12:00:00.000Z").getTime();
const koName = () => `${pick(SURNAMES)}${pick(GIVEN_NAMES)}`;
const minIso = (a: string, b: string) =>
  new Date(a).getTime() <= new Date(b).getTime() ? a : b;

// 인라인 텍스트 풀
const MENTOR_POSITIONS = ["선임 매니저", "팀장", "책임", "수석", "파트장"];
const MENTOR_EXPERTISE = ["채용·인사", "현업 직무", "마케팅", "개발", "물류 운영", "고객경험"];
const MENTOR_NOTES = [
  "직무 적합도가 높아 추가 코칭을 권장.",
  "포트폴리오 보강이 필요한 영역을 안내함.",
  "면접 답변 구조화를 함께 연습.",
  "현업 사례를 공유하고 질의응답 진행.",
  "다음 세션까지 과제를 부여함.",
];
const REQUIREMENTS = [
  "관련 교육과정 이수자 우대",
  "기본 OA 활용 가능자",
  "성실하고 책임감 있는 분",
  "팀 협업 경험",
  "데이터 도구 활용 가능자",
  "고객 응대 경험",
];
const BENEFITS = [
  "4대보험",
  "교통비 지원",
  "중식 제공",
  "정규직 전환 기회",
  "교육비 지원",
  "유연근무",
];
const PROJECT_TITLES = [
  "AI 마케팅 캠페인 기획안",
  "물류 동선 최적화 분석",
  "베이커리 신메뉴 콘텐츠",
  "지역 축제 운영 리포트",
  "데이터 대시보드 구축",
  "숏폼 콘텐츠 시리즈",
  "캡스톤 최종 산출물",
];
const PROJECT_DESCS = [
  "교육과정에서 수행한 팀 프로젝트 결과물입니다.",
  "Spot Work 경험을 바탕으로 정리한 산출물입니다.",
  "현장 데이터를 활용해 분석/제작했습니다.",
  "멘토 피드백을 반영해 완성했습니다.",
];
const NOTI_TEMPLATES: {
  type: NotificationType;
  title: string;
  body: string;
  link: string;
}[] = [
  { type: "spot", title: "새로운 Spot 추천", body: "회원님 등급에 맞는 일감이 등록되었습니다.", link: "/spot" },
  { type: "spot", title: "Spot 정산 완료", body: "수행하신 Spot 보상이 정산되었습니다.", link: "/spot/history" },
  { type: "course", title: "수강 신청 마감 임박", body: "관심 과정의 모집이 곧 마감됩니다.", link: "/courses" },
  { type: "course", title: "출석 안내", body: "오늘 수업 출석을 잊지 마세요.", link: "/courses" },
  { type: "badge", title: "디지털 배지 발급", body: "이수 배지가 발급되었습니다.", link: "/me/badges" },
  { type: "placement", title: "채용 공고 알림", body: "매칭된 협약기업의 새 공고가 있습니다.", link: "/jobs" },
  { type: "mentoring", title: "멘토링 일정", body: "예정된 멘토링 세션이 있습니다.", link: "/me" },
  { type: "system", title: "외부 시스템 연동", body: "구직준비도 검사 결과가 반영되었습니다.", link: "/me" },
];
const FOLLOWUPS: { q: string; a: string }[] = [
  { q: "그럼 다음 주에 신청하면 될까요?", a: "(현재 상태) 정원 여유가 있습니다.\n(제안) 이번 주 내 신청을 권장합니다.\n(다음 액션) 과목 상세에서 '수강신청'을 눌러주세요." },
  { q: "제 등급으로 가능한 일감이 더 있나요?", a: "(현재 상태) 현재 등급 기준 추천 일감이 더 있습니다.\n(제안) 관심사 필터를 적용해 보세요.\n(다음 액션) Spot 게시판에서 필터를 조정하세요." },
  { q: "포트폴리오는 어떻게 공유하나요?", a: "(현재 상태) 포트폴리오가 준비되어 있습니다.\n(제안) 협약기업에 1-click 공유가 가능합니다.\n(다음 액션) 포트폴리오 화면의 '공유 카드'를 사용하세요." },
  { q: "더 자세히 알려줄 수 있나요?", a: "(현재 상태) 추가 정보를 안내드립니다.\n(제안) 구체적 목표 직무를 알려주시면 맞춤 안내가 가능합니다.\n(다음 액션) 목표 직무를 입력해 주세요." },
];

// ──────────────────────────────────────────────
// 멘토 (협약기업 소속)
// ──────────────────────────────────────────────
function buildMentors(companies: Company[]): Mentor[] {
  const nextId = idFactory("mnt");
  const mentors: Mentor[] = [];
  companies.forEach((c, i) => {
    const count = i < 6 ? 2 : 1; // 18 + 6 = 24
    for (let k = 0; k < count; k++) {
      mentors.push({
        id: nextId(),
        name: `${koName()} ${pick(MENTOR_POSITIONS)}`,
        companyId: c.id,
        position: pick(MENTOR_POSITIONS),
        expertise: pick(MENTOR_EXPERTISE),
      });
    }
  });
  return mentors;
}

// ──────────────────────────────────────────────
// 수강 (600)
// ──────────────────────────────────────────────
function pickEnrollmentStatus(userStatus: UserStatus): EnrollmentStatus {
  switch (userStatus) {
    case "dropped":
      return weighted<EnrollmentStatus>([
        { weight: 5, value: "dropped" },
        { weight: 2, value: "failed" },
        { weight: 2, value: "completed" },
        { weight: 1, value: "in_progress" },
      ]);
    case "completed":
    case "employed":
      return weighted<EnrollmentStatus>([
        { weight: 8, value: "completed" },
        { weight: 2, value: "in_progress" },
        { weight: 1, value: "failed" },
      ]);
    case "enrolled":
      return weighted<EnrollmentStatus>([
        { weight: 6, value: "in_progress" },
        { weight: 4, value: "completed" },
        { weight: 1, value: "dropped" },
        { weight: 1, value: "failed" },
      ]);
    case "spot_active":
      return weighted<EnrollmentStatus>([
        { weight: 4, value: "completed" },
        { weight: 4, value: "in_progress" },
        { weight: 2, value: "dropped" },
      ]);
    default:
      return "in_progress";
  }
}

function makeEnrollment(
  id: string,
  user: User,
  course: Course,
  program: Program
): Enrollment {
  const status = pickEnrollmentStatus(user.status);
  let attendanceRate: number;
  let score: number;

  if (status === "completed") {
    attendanceRate = int(82, 100);
    score = int(70, 96);
  } else if (status === "in_progress") {
    attendanceRate = int(60, 95);
    score = int(60, 88);
  } else if (status === "failed") {
    attendanceRate = int(50, 79);
    score = int(40, 64);
  } else {
    attendanceRate = int(15, 65);
    score = int(0, 55);
  }

  const enrolledAt = iso(
    dateBetween(program.startDate, minIso(program.endDate, "2026-05-20"))
  );
  const completedAt =
    status === "completed"
      ? iso(dateBetween(enrolledAt, minIso(program.endDate, "2026-05-24")))
      : undefined;

  return {
    id,
    userId: user.id,
    courseId: course.id,
    attendanceRate,
    score,
    status,
    enrolledAt,
    completedAt,
  };
}

function generateEnrollments(
  users: User[],
  courses: Course[],
  programByCourse: Map<string, Program>
): Enrollment[] {
  const nextId = idFactory("enr");
  const list: Enrollment[] = [];
  const byTrack = {
    try_job: courses.filter((c) => programByCourse.get(c.id)!.track === "try_job"),
    get_job: courses.filter((c) => programByCourse.get(c.id)!.track === "get_job"),
  };

  const budget: Record<UserStatus, [number, number]> = {
    registered: [0, 0],
    spot_active: [0, 2],
    enrolled: [2, 4],
    completed: [3, 5],
    employed: [3, 5],
    dropped: [1, 3],
  };

  for (const u of users) {
    const [lo, hi] = budget[u.status];
    const n = int(lo, hi);
    if (n === 0) continue;
    const pool = byTrack[u.track];
    const chosen = picks(pool, Math.min(n, pool.length));
    for (const course of chosen) {
      list.push(makeEnrollment(nextId(), u, course, programByCourse.get(course.id)!));
    }
  }

  // 정확히 600건으로 보정
  while (list.length > 600) list.pop();
  const fillable = users.filter((u) => u.status !== "registered");
  let guard = 0;
  while (list.length < 600 && guard++ < 5000) {
    const u = pick(fillable);
    const pool = byTrack[u.track];
    const course = pick(pool);
    list.push(makeEnrollment(nextId(), u, course, programByCourse.get(course.id)!));
  }

  return list;
}

// ──────────────────────────────────────────────
// Spot 수행 이력 (Σ user.spotCount)
// ──────────────────────────────────────────────
function generateSpotHistory(users: User[], spotJobs: SpotJob[]): SpotHistory[] {
  const nextId = idFactory("sph");
  const completedJobs = spotJobs.filter((j) => j.status === "completed");
  const list: SpotHistory[] = [];

  for (const u of users) {
    for (let i = 0; i < u.spotCount; i++) {
      const job = pick(completedJobs);
      const seq: 1 | 2 | 3 | null = i === 0 ? 1 : i === 1 ? 2 : i === 2 ? 3 : null;
      const { bonusType, bonusAmount, totalPaid } = calcTotalPaid(job.baseWage, seq);
      const started = dateBetween(job.createdAt, "2026-05-24T16:00:00.000Z");
      const completed = new Date(started.getTime() + job.durationMin * 60000);
      list.push({
        id: nextId(),
        userId: u.id,
        jobId: job.id,
        startedAt: iso(started),
        completedAt: iso(completed),
        baseWage: job.baseWage,
        bonusType,
        bonusAmount,
        totalPaid,
        rating: float(3.5, 5.0, 1),
        feedback: pick(SPOT_FEEDBACKS),
        successSequence: seq,
      });
    }
  }
  return list;
}

// ──────────────────────────────────────────────
// 채용 공고 (24)
// ──────────────────────────────────────────────
function generateJobPostings(companies: Company[]): JobPosting[] {
  const nextId = idFactory("job");
  const list: JobPosting[] = [];
  companies.forEach((c, i) => {
    const count = i < 6 ? 2 : 1; // 18 + 6 = 24
    for (let k = 0; k < count; k++) {
      const dept = pick(c.matchedDepartments);
      list.push({
        id: nextId(),
        companyId: c.id,
        title: `${c.name} ${dept} 분야 채용`,
        description: `${c.name}에서 ${dept} 직무 신입/인턴을 모집합니다.`,
        requirements: picks(REQUIREMENTS, int(2, 4)),
        contractType: weighted([
          { weight: 6, value: "employment_pact" as const },
          { weight: 5, value: "reserved_quota" as const },
          { weight: 8, value: "general" as const },
        ]),
        benefits: picks(BENEFITS, int(2, 4)),
        deadline: isoDate(dateBetween("2026-05-26", "2026-08-31")),
        applicantCount: int(3, 45),
      });
    }
  });
  return list;
}

// ──────────────────────────────────────────────
// 채용 연계 (41) — hired 시 User.status='employed' 동기화
// ──────────────────────────────────────────────
function generatePlacements(
  users: User[],
  companies: Company[],
  jobPostings: JobPosting[]
): Placement[] {
  const nextId = idFactory("plc");
  const employed = users.filter((u) => u.status === "employed");
  const getCompleted = users.filter(
    (u) => u.track === "get_job" && u.status === "completed"
  );
  const tryCompleted = users.filter(
    (u) => u.track === "try_job" && u.status === "completed"
  );
  const ordered = [...employed, ...getCompleted, ...tryCompleted].slice(0, 41);

  const statuses: PlacementStatus[] = [];
  for (let i = 0; i < 35; i++) statuses.push("hired");
  for (let i = 0; i < 3; i++) statuses.push("interviewing");
  for (let i = 0; i < 2; i++) statuses.push("applied");
  statuses.push("rejected"); // 총 41

  const postingsByCompany = new Map<string, JobPosting[]>();
  for (const p of jobPostings) {
    const arr = postingsByCompany.get(p.companyId) ?? [];
    arr.push(p);
    postingsByCompany.set(p.companyId, arr);
  }

  return ordered.map((u, idx) => {
    const status = statuses[idx] ?? "applied";
    const company = pick(companies);
    const posting = pick(postingsByCompany.get(company.id) ?? jobPostings);
    // 지원 → 면접 → 채용 순서를 보장하도록 상한을 단계적으로 둔다.
    const appliedAt = iso(dateBetween(u.joinedAt, "2026-05-22"));

    let interviewAt: string | undefined;
    let hiredAt: string | undefined;
    if (status !== "applied") {
      interviewAt = iso(dateBetween(appliedAt, "2026-05-23"));
    }
    if (status === "hired") {
      hiredAt = iso(dateBetween(interviewAt!, "2026-05-24"));
      u.status = "employed"; // 단일 진실원본 동기화
    }

    return {
      id: nextId(),
      userId: u.id,
      companyId: company.id,
      jobPostingId: posting.id,
      appliedAt,
      interviewAt,
      hiredAt,
      status,
    };
  });
}

// ──────────────────────────────────────────────
// 멘토링 (218)
// ──────────────────────────────────────────────
function generateMentorships(users: User[], mentors: Mentor[]): Mentorship[] {
  const nextId = idFactory("mtr");
  const pool = users.filter((u) =>
    ["enrolled", "completed", "employed"].includes(u.status)
  );
  const base = pool.length ? pool : users;
  const list: Mentorship[] = [];
  for (let i = 0; i < 218; i++) {
    const u = pick(base);
    const m = pick(mentors);
    list.push({
      id: nextId(),
      userId: u.id,
      mentorId: m.id,
      companyId: m.companyId,
      sessionDate: iso(dateBetween("2026-01-15", "2026-05-24")),
      durationMin: pick([30, 45, 60, 90]),
      topic: pick(MENTORING_TOPICS),
      notes: pick(MENTOR_NOTES),
      rating: float(3.5, 5.0, 1),
    });
  }
  return list;
}

// ──────────────────────────────────────────────
// 디지털 배지 (목표 410, 이수자에게만, 1~5/인)
// ──────────────────────────────────────────────
function generateBadges(
  enrollments: Enrollment[],
  programByCourse: Map<string, Program>,
  users: User[]
): Badge[] {
  const nextId = idFactory("bdg");
  const badges: Badge[] = [];
  const perUser = new Map<string, number>();
  const userById = new Map(users.map((u) => [u.id, u]));

  for (const e of enrollments) {
    if (e.status !== "completed" || !isEligibleForBadge(e)) continue;
    if ((perUser.get(e.userId) ?? 0) >= 5) continue;
    const program = programByCourse.get(e.courseId);
    const id = nextId();
    const badge = issueBadgeForEnrollment(
      e,
      program,
      id,
      e.completedAt ?? iso(new Date(NOW))
    );
    if (badge) {
      badges.push(badge);
      perUser.set(e.userId, (perUser.get(e.userId) ?? 0) + 1);
    }
  }

  // 목표 410 까지 spot_milestone 배지로 보충 (이수 경험자 한정, 1~5/인)
  const completers = [...perUser.keys()];
  let i = 0;
  const safety = Math.max(1, completers.length) * 6;
  while (badges.length < 410 && completers.length && i < safety) {
    const uid = completers[i % completers.length];
    i++;
    if ((perUser.get(uid) ?? 0) >= 5) continue;
    const u = userById.get(uid)!;
    const id = nextId();
    badges.push({
      id,
      userId: uid,
      type: "spot_milestone",
      level: u.spotGrade as BadgeLevel,
      name: `${GRADE_LABEL[u.spotGrade]} Spot 마일스톤`,
      issuedAt: iso(dateBetween(u.joinedAt, "2026-05-24")),
      certUrl: buildCertUrl(id),
    });
    perUser.set(uid, (perUser.get(uid) ?? 0) + 1);
  }

  if (badges.length > 410) badges.length = 410;
  return badges;
}

// ──────────────────────────────────────────────
// 포트폴리오 (200, 사용자당 1개)
// ──────────────────────────────────────────────
function generatePortfolios(
  users: User[],
  companies: Company[],
  badges: Badge[]
): Portfolio[] {
  const nextId = idFactory("pf");
  const companyIds = companies.map((c) => c.id);
  const badgesByUser = new Map<string, Badge[]>();
  for (const b of badges) {
    const arr = badgesByUser.get(b.userId) ?? [];
    arr.push(b);
    badgesByUser.set(b.userId, arr);
  }

  return users.map((u) => {
    const id = nextId();
    const uBadges = badgesByUser.get(u.id) ?? [];
    const advanced = ["completed", "employed", "enrolled"].includes(u.status);
    const nProj = advanced ? int(1, 3) : int(0, 1);
    const projects: PortfolioProject[] = Array.from({ length: nProj }, (_, k) => ({
      id: `${id}_p${k + 1}`,
      title: pick(PROJECT_TITLES),
      description: pick(PROJECT_DESCS),
      createdAt: iso(dateBetween(u.joinedAt, "2026-05-24")),
    }));
    const shared =
      u.status === "completed" || u.status === "employed"
        ? picks(companyIds, int(0, 3))
        : [];

    return {
      id,
      userId: u.id,
      sharedWithCompanies: shared,
      projects,
      badgeIds: uBadges.map((b) => b.id),
      summary: `${TRACK_LABEL[u.track]} 트랙 · ${GRADE_LABEL[u.spotGrade]} 등급 · 이수 배지 ${uBadges.length}개`,
      lastUpdated: iso(dateBetween(u.joinedAt, "2026-05-24")),
    };
  });
}

// ──────────────────────────────────────────────
// AI 챗 세션 (80, 5~15턴)
// ──────────────────────────────────────────────
function generateChatSessions(users: User[]): ChatSession[] {
  const nextId = idFactory("cht");
  const list: ChatSession[] = [];
  const targets = picks(users, 80);

  for (const u of targets) {
    const sample = pick(CHAT_SAMPLES);
    const len = int(5, 15);
    const created = dateBetween(u.joinedAt, "2026-05-24");
    let t = created.getTime();
    const messages: ChatMessage[] = [];

    const push = (role: ChatMessage["role"], content: string) => {
      messages.push({ role, content, timestamp: iso(new Date(t)) });
      t += role === "user" ? 60000 : 120000;
    };

    push("user", sample.turns[0].q);
    push("assistant", sample.turns[0].a);
    while (messages.length < len) {
      const f = pick(FOLLOWUPS);
      push("user", f.q);
      push("assistant", f.a);
    }
    messages.length = len;

    list.push({
      id: nextId(),
      userId: u.id,
      title: sample.title,
      messages,
      createdAt: iso(created),
    });
  }
  return list;
}

// ──────────────────────────────────────────────
// 알림 (사용자당 4~12)
// ──────────────────────────────────────────────
function generateNotifications(users: User[]): Notification[] {
  const nextId = idFactory("ntf");
  const list: Notification[] = [];
  for (const u of users) {
    const n = int(4, 12);
    for (let i = 0; i < n; i++) {
      const tmpl = pick(NOTI_TEMPLATES);
      const created = dateBetween("2026-04-25", "2026-05-25T18:00:00.000Z");
      const ageDays = (NOW - created.getTime()) / 86400000;
      list.push({
        id: nextId(),
        userId: u.id,
        type: tmpl.type,
        title: tmpl.title,
        body: tmpl.body,
        link: tmpl.link,
        read: chance(ageDays > 7 ? 0.9 : 0.4),
        createdAt: iso(created),
      });
    }
  }
  return list;
}

// ──────────────────────────────────────────────
// 마스터 오케스트레이터
// ──────────────────────────────────────────────
export function generateDataset(): Dataset {
  faker.seed(42); // 결정론적 시드 고정

  const users = buildUsers();
  const instructors = buildInstructors();
  const programs = buildPrograms();
  const courses = buildCourses(programs, instructors);
  const companies = buildCompanies();
  const employers = buildEmployers();
  const mentors = buildMentors(companies);
  const spotJobs = buildSpotJobs(employers);

  const programById = new Map(programs.map((p) => [p.id, p]));
  const programByCourse = new Map(
    courses.map((c) => [c.id, programById.get(c.programId)!])
  );

  const enrollments = generateEnrollments(users, courses, programByCourse);
  const spotHistory = generateSpotHistory(users, spotJobs);
  const jobPostings = generateJobPostings(companies);
  const placements = generatePlacements(users, companies, jobPostings); // users 변경
  const mentorships = generateMentorships(users, mentors);
  const badges = generateBadges(enrollments, programByCourse, users);
  const portfolios = generatePortfolios(users, companies, badges);
  const chatSessions = generateChatSessions(users);
  const notifications = generateNotifications(users);

  return {
    users,
    instructors,
    employers,
    mentors,
    programs,
    courses,
    enrollments,
    spotJobs,
    spotHistory,
    companies,
    jobPostings,
    mentorships,
    badges,
    portfolios,
    chatSessions,
    placements,
    notifications,
  };
}
