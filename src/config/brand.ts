/**
 * 시스템 브랜딩 단일 관리 파일.
 * 시스템명/테마 변경 시 이 파일만 수정하면 전체에 반영됩니다.
 * 모든 컴포넌트는 `import { BRAND, THEME } from "@/config/brand"` 로 접근.
 */

export const BRAND = {
  systemName: "ync-jump-spot",
  displayName: "도약",
  fullName: "청년도약 인재양성 부트캠프 통합 시스템",
  tagline: "Spot Work에서 시작하는 청년의 도약",
  copyright: "© 2026 ync-jump-spot. All rights reserved.",
} as const;

export const THEME = {
  primary: "#1E40AF",
  accent: "#F59E0B",
  success: "#10B981",
  warning: "#EF4444",
  trackTryJob: "#8B5CF6",
  trackGetJob: "#0EA5E9",
} as const;

/** 차트 등에서 자주 쓰는 보조 팔레트 */
export const CHART_COLORS = [
  THEME.primary,
  THEME.accent,
  THEME.success,
  THEME.trackTryJob,
  THEME.trackGetJob,
  "#6366F1",
  "#EC4899",
  "#14B8A6",
] as const;

export const GRADE_COLORS = {
  bronze: "#B45309",
  silver: "#64748B",
  gold: "#F59E0B",
  platinum: "#0EA5E9",
} as const;
