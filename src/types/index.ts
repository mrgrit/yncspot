/**
 * ync-jump-spot 전역 타입 정의.
 * 기획서 §3 데이터 모델 + 참조 무결성을 위해 추가한 엔티티(Instructor/Employer/Mentor) 포함.
 */

// ──────────────────────────────────────────────
// 공통 유니온
// ──────────────────────────────────────────────
export type Role =
  | "youth"
  | "instructor"
  | "operator"
  | "company"
  | "employer"
  | "admin";

export type Track = "try_job" | "get_job";

export type UserStatus =
  | "registered"
  | "spot_active"
  | "enrolled"
  | "completed"
  | "employed"
  | "dropped";

export type SpotGrade = "bronze" | "silver" | "gold" | "platinum";

export type ProgramArea = "social" | "liberal" | "ai_common" | "professional";
export type ProgramLevel = "common" | "beginner" | "intermediate" | "advanced";
export type ProgramType = "common" | "major" | "capstone";

export type CourseFormat = "onsite" | "online" | "flipped";

export type EnrollmentStatus = "in_progress" | "completed" | "failed" | "dropped";

export type SpotJobStatus = "open" | "matched" | "in_progress" | "completed";

export type BonusType = "transport" | "half" | "full" | null;

export type ContractType = "employment_pact" | "reserved_quota" | "general";

export type PlacementStatus = "applied" | "interviewing" | "hired" | "rejected";

export type BadgeType =
  | "course_completion"
  | "spot_milestone"
  | "capstone"
  | "mentoring"
  | "track_transfer";

export type BadgeLevel = "bronze" | "silver" | "gold" | "platinum";

export type NotificationType =
  | "spot"
  | "course"
  | "badge"
  | "placement"
  | "mentoring"
  | "system";

export type ChatRole = "user" | "assistant" | "system";

// ──────────────────────────────────────────────
// 엔티티
// ──────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthDate: string; // ISO date (yyyy-mm-dd)
  gender: "male" | "female";
  address: string;
  track: Track;
  status: UserStatus;
  spotGrade: SpotGrade;
  spotCount: number; // 누적 Spot 수행 횟수
  nais_registered: boolean; // nais.or.kr 통합플랫폼 등재
  gov24_assessed: boolean; // 고용24 구직준비도 검사 여부
  gov24_score?: number; // 0~100
  interests: string[]; // 관심 직무
  // 상세(한 뎁스 더)
  school: string; // 소속/출신 학과
  major: string; // 전공
  goal: string; // 목표 직무
  skills: string[]; // 보유 역량
  bio: string; // 한 줄 소개
  // 페르소나 (개인정보 기반)
  situation: string; // 상황(고졸 후 미취업 / 대학 휴학 후 장기 미복학 등)
  rested: boolean; // '쉬었음' 청년 여부
  story: string; // 사연
  motivation: string; // 과정 신청 계기
  joinedAt: string; // ISO datetime
  lastActiveAt: string; // ISO datetime
  avatarColor: string; // hex
}

/** 교강사 (Course.instructorId 참조 대상) */
export interface Instructor {
  id: string;
  name: string;
  email: string;
  specialty: string;
  bio: string;
}

/** Spot 발주처 (SpotJob.employerId 참조 대상) */
export interface Employer {
  id: string;
  name: string;
  category: string; // 카페 / 매장 / 행사대행 / 물류 / 데이터입력
  district: string; // 부산 남구 / 해운대 / 서면 …
  contactPerson: string;
  rating: number; // 발주처 평판 평점
}

/** 멘토 (Mentorship.mentorId 참조 대상) */
export interface Mentor {
  id: string;
  name: string;
  companyId: string;
  position: string;
  expertise: string;
}

export interface Program {
  id: string;
  name: string;
  track: Track;
  type: ProgramType;
  area: ProgramArea;
  level: ProgramLevel;
  hours: number;
  capacity: number;
  startDate: string;
  endDate: string;
  // 상세(한 뎁스 더)
  description: string;
  syllabus: string[]; // 모듈/주차 구성
  outcomes: string[]; // 학습 성과
}

export interface Course {
  id: string;
  programId: string;
  name: string;
  instructorId: string;
  format: CourseFormat;
  location: string;
  schedule: string; // 예: "월/수 14:00-17:00"
  capacity: number;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  attendanceRate: number; // 0~100
  score: number; // 0~100
  status: EnrollmentStatus;
  enrolledAt: string;
  completedAt?: string;
}

export interface SpotJob {
  id: string;
  employerId: string;
  title: string;
  description: string;
  category: string;
  durationMin: number;
  baseWage: number; // 일당/건당 기준 금액
  requiredGrade: SpotGrade;
  location: string;
  status: SpotJobStatus;
  createdAt: string;
  scheduledAt: string;
  aiTask?: AiTask; // "AI 일자리" 카테고리 전용 검수 작업 명세
}

// ── AI 일자리 (AI 검수 크라우드워크) ──────────────
export type OutputFieldKind =
  | "text_short"
  | "text_long"
  | "screenshot"
  | "command_output"
  | "url"
  | "rating"
  | "choice_single"
  | "choice_multi"
  | "yes_no"
  | "json";

export interface OutputField {
  key: string;
  label: string;
  helperText?: string;
  kind: OutputFieldKind;
  required: boolean;
  options?: string[];
}

export interface AiTask {
  domain: string; // food-bev / welfare / security / vision / data / fact
  domainLabel: string;
  guideMd: string; // 검수 가이드 (markdown 유사 텍스트)
  fields: OutputField[]; // 동적 출력 폼 스키마
  estimatedMin: number;
}

export interface SpotHistory {
  id: string;
  userId: string;
  jobId: string;
  startedAt: string;
  completedAt: string;
  baseWage: number;
  bonusType: BonusType;
  bonusAmount: number;
  totalPaid: number;
  rating: number; // 3.5 ~ 5.0
  feedback: string;
  successSequence: 1 | 2 | 3 | null; // 개인 첫 1·2·3번째 성공
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  size: "대기업" | "중견기업" | "중소기업" | "공공기관";
  address: string;
  matchedDepartments: string[];
  hiringQuota: number;
  contactPerson: string;
  contactEmail: string;
}

export interface JobPosting {
  id: string;
  companyId: string;
  title: string;
  description: string;
  requirements: string[];
  contractType: ContractType;
  benefits: string[];
  deadline: string;
  applicantCount: number;
}

export interface Mentorship {
  id: string;
  userId: string;
  mentorId: string;
  companyId: string;
  sessionDate: string;
  durationMin: number;
  topic: string;
  notes: string;
  rating: number;
}

export interface Badge {
  id: string;
  userId: string;
  type: BadgeType;
  level: BadgeLevel;
  name: string;
  programId?: string;
  issuedAt: string;
  certUrl: string; // Mock 발급 URL
}

export interface ProjectDetail {
  overview: string;
  role: string;
  stack: string[];
  outcomes: string[];
  period: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  kind?: "capstone" | "practice" | "project";
  programId?: string;
  link?: string;
  createdAt: string;
  detail?: ProjectDetail; // 제목 클릭 시 상세
}

export interface Portfolio {
  id: string;
  userId: string;
  sharedWithCompanies: string[]; // companyId[]
  projects: PortfolioProject[];
  badgeIds: string[];
  learnings?: string[]; // 과정 중 배운 것 (수료생 보존)
  summary: string;
  lastUpdated: string;
}

export interface ChatMessage {
  role: ChatRole;
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}

export interface Placement {
  id: string;
  userId: string;
  companyId: string;
  jobPostingId: string;
  appliedAt: string;
  interviewAt?: string;
  hiredAt?: string;
  status: PlacementStatus;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
}

// 상담 내역 (사업단·본인 전용)
export type CounselingType = "intake" | "regular" | "career" | "psych" | "job";

export interface Counseling {
  id: string;
  userId: string;
  counselor: string;
  type: CounselingType;
  date: string;
  summary: string;
  note: string;
  nextPlan: string;
}

// ──────────────────────────────────────────────
// 전체 데이터셋 (DataContext 가 보유)
// ──────────────────────────────────────────────
export interface Dataset {
  users: User[];
  instructors: Instructor[];
  employers: Employer[];
  mentors: Mentor[];
  programs: Program[];
  courses: Course[];
  enrollments: Enrollment[];
  spotJobs: SpotJob[];
  spotHistory: SpotHistory[];
  companies: Company[];
  jobPostings: JobPosting[];
  mentorships: Mentorship[];
  badges: Badge[];
  portfolios: Portfolio[];
  chatSessions: ChatSession[];
  placements: Placement[];
  notifications: Notification[];
  counselings: Counseling[];
}
