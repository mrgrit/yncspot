import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, GraduationCap, Building2 } from "lucide-react";
import { BRAND } from "@/config/brand";
import { BrandIcon } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-slate-50">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-800 text-white">
            <BrandIcon className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold text-slate-900">{BRAND.displayName}</span>
          <span className="text-xs text-slate-400">{BRAND.systemName}</span>
        </div>
        <Link to="/login">
          <Button size="sm">로그인</Button>
        </Link>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
          <Sparkles className="h-3.5 w-3.5" /> 2026 청년도약 인재양성 부트캠프
        </span>
        <h1 className="mt-5 text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
          {BRAND.tagline}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-500">
          부담 없는 Spot Work로 시작해 작은 성취와 보상을 쌓고, 교육·일경험·포트폴리오를
          거쳐 협약기업 취업까지 한 곳에서 연결합니다.
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <Link to="/login">
            <Button size="lg">
              시작하기 <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl gap-4 px-6 pb-20 sm:grid-cols-3">
        {[
          { icon: Sparkles, title: "Spot Work", desc: "저관여로 시작하는 단기 일경험과 단계별 보상" },
          { icon: GraduationCap, title: "3영역 동시이수", desc: "교양·사회 + AI공통 + 실전·전문 + 캡스톤" },
          { icon: Building2, title: "협약기업 매칭", desc: "학습+일경험 포트폴리오 기반 채용 연계" },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <f.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-3 font-semibold text-slate-900">{f.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        {BRAND.copyright}
      </footer>
    </div>
  );
}
