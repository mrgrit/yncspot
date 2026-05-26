import {
  Briefcase,
  Building2,
  BookOpen,
  FileBarChart,
  GraduationCap,
  Home,
  LayoutDashboard,
  MessageCircle,
  Sparkles,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "대시보드", icon: LayoutDashboard, end: true },
  { to: "/admin/members", label: "참여자", icon: Users },
  { to: "/admin/courses", label: "교육과정", icon: BookOpen },
  { to: "/admin/spot-jobs", label: "Spot Work", icon: Sparkles },
  { to: "/admin/companies", label: "협약기업", icon: Building2 },
  { to: "/admin/placements", label: "취업매칭", icon: Target },
  { to: "/admin/graduates", label: "수료생", icon: GraduationCap },
  { to: "/admin/reports", label: "보고서", icon: FileBarChart },
];

export const YOUTH_NAV: NavItem[] = [
  { to: "/me", label: "홈", icon: Home, end: true },
  { to: "/spot", label: "Spot", icon: Sparkles },
  { to: "/courses", label: "학습", icon: BookOpen },
  { to: "/jobs", label: "채용", icon: Briefcase },
  { to: "/chat", label: "AI", icon: MessageCircle },
];

export const ROLE_LABEL: Record<string, string> = {
  youth: "참여자",
  operator: "사업단 운영자",
  company: "협약기업",
  admin: "시스템 관리자",
};
