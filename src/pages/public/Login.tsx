import { useNavigate } from "react-router-dom";
import {
  Building2,
  ShieldCheck,
  Sparkles,
  UserCog,
  GraduationCap,
} from "lucide-react";
import { BRAND } from "@/config/brand";
import { BrandIcon } from "@/components/BrandLogo";
import { useAuth, type AppRole } from "@/contexts/AuthContext";
import { homePathFor } from "@/routes/guards";
import { Card } from "@/components/ui/card";

const ROLES: {
  role: AppRole;
  label: string;
  desc: string;
  icon: typeof Sparkles;
}[] = [
  { role: "youth", label: "참여자", desc: "Spot·수강·AI 상담", icon: GraduationCap },
  { role: "operator", label: "사업단 운영자", desc: "대시보드·운영·보고서", icon: UserCog },
  { role: "company", label: "협약기업", desc: "인재 풀·채용 공고", icon: Building2 },
  { role: "admin", label: "시스템 관리자", desc: "권한·데이터 운영", icon: ShieldCheck },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = (role: AppRole) => {
    login(role);
    navigate(homePathFor(role), { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-800 text-white">
            <BrandIcon className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{BRAND.displayName}</h1>
          <p className="mt-1 text-sm text-slate-500">{BRAND.fullName}</p>
          <p className="mt-0.5 text-xs text-slate-400">{BRAND.tagline}</p>
        </div>

        <Card className="p-5">
          <p className="mb-3 text-sm font-medium text-slate-600">
            데모 역할을 선택해 로그인하세요
          </p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {ROLES.map((r) => (
              <button
                key={r.role}
                onClick={() => handle(r.role)}
                className="flex flex-col items-start gap-1 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/40"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <r.icon className="h-5 w-5" />
                </span>
                <span className="mt-1 text-sm font-semibold text-slate-800">
                  {r.label}
                </span>
                <span className="text-xs text-slate-400">{r.desc}</span>
              </button>
            ))}
          </div>
        </Card>

        <p className="mt-4 text-center text-xs text-slate-400">
          {BRAND.copyright}
        </p>
      </div>
    </div>
  );
}
