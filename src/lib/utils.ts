import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind 클래스 병합 (shadcn 표준) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ──────────────────────────────────────────────
// 포맷터
// ──────────────────────────────────────────────
export function formatDate(iso: string | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

export function formatDateTime(iso: string | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${formatDate(iso)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "3일 전" 형태의 상대 시간 (기준일 고정: 2026-05-25) */
const NOW = new Date("2026-05-25T12:00:00+09:00").getTime();
export function fromNow(iso: string | undefined): string {
  if (!iso) return "-";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "-";
  const diff = NOW - t;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}일 전`;
  const mon = Math.floor(day / 30);
  return `${mon}개월 전`;
}

export function formatCurrency(won: number): string {
  return `${Math.round(won).toLocaleString("ko-KR")}원`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString("ko-KR");
}

export function formatPercent(n: number, digits = 0): string {
  return `${n.toFixed(digits)}%`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

// ──────────────────────────────────────────────
// 한글 라벨 매핑 (UI 표기 일원화)
// ──────────────────────────────────────────────
export const TRACK_LABEL = {
  try_job: "Try Job",
  get_job: "Get Job",
} as const;

export const TRACK_DESC = {
  try_job: "쉬었음·장기 미복학 청년",
  get_job: "졸업 후 미취업 청년",
} as const;

export const STATUS_LABEL = {
  registered: "가입",
  spot_active: "Spot 활동중",
  enrolled: "수강중",
  completed: "이수완료",
  employed: "취업",
  dropped: "중도탈락",
} as const;

export const GRADE_LABEL = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
} as const;

export const AREA_LABEL = {
  social: "사회",
  liberal: "교양",
  ai_common: "AI공통",
  professional: "실전·전문",
} as const;

export const LEVEL_LABEL = {
  common: "공통",
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
} as const;

export const PROGRAM_TYPE_LABEL = {
  common: "공통",
  major: "전공",
  capstone: "캡스톤",
} as const;

export const ENROLLMENT_STATUS_LABEL = {
  in_progress: "진행중",
  completed: "이수완료",
  failed: "미이수",
  dropped: "중도탈락",
} as const;

export const SPOTJOB_STATUS_LABEL = {
  open: "모집중",
  matched: "매칭완료",
  in_progress: "진행중",
  completed: "완료",
} as const;

export const BONUS_LABEL = {
  transport: "교통비(1차)",
  half: "½ 일당(2차)",
  full: "일당 전액(3차)",
} as const;

export const PLACEMENT_STATUS_LABEL = {
  applied: "지원",
  interviewing: "면접중",
  hired: "채용확정",
  rejected: "불합격",
} as const;

export const CONTRACT_TYPE_LABEL = {
  employment_pact: "채용약정",
  reserved_quota: "계약정원제",
  general: "일반채용",
} as const;
