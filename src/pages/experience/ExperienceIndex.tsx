import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, FlaskConical } from "lucide-react";
import { BRAND } from "@/config/brand";
import { BrandIcon } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { EXPERIENCE_COURSES } from "@/data/experience";

export default function ExperienceIndex() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-slate-50">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-800 text-white">
            <BrandIcon className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold text-slate-900">{BRAND.displayName}</span>
          <span className="hidden text-xs text-slate-400 sm:inline">{BRAND.systemName}</span>
        </Link>
        <Link to="/login">
          <Button size="sm" variant="outline">
            로그인
          </Button>
        </Link>
      </header>

      <section className="mx-auto max-w-3xl px-6 pt-10 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
          <FlaskConical className="h-3.5 w-3.5" /> 전공별 X+AI 교육 접목 · 시연
        </span>
        <h1 className="mt-5 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
          수업 체험하기
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-500">
          인공지능을 활용해 실제 세상의 문제를 미리 경험시킴으로써 실무 능력을 강화합니다.
          아래 과정의 시뮬레이터를 직접 만져보세요. 설치할 프로그램도, 컴퓨터 지식도 필요하지 않습니다.
        </p>
      </section>

      <section className="mx-auto grid max-w-5xl gap-5 px-6 py-12 md:grid-cols-3">
        {EXPERIENCE_COURSES.map((c) => (
          <Link
            key={c.id}
            to={`/experience/${c.id}`}
            className={`group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-colors ${c.accent.ring}`}
          >
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.accent.icon}`}
            >
              <c.icon className="h-6 w-6" />
            </span>
            <span
              className={`mt-4 inline-flex w-fit rounded-full px-2.5 py-0.5 text-[11px] font-medium ${c.accent.chip}`}
            >
              {c.major}
            </span>
            <h2 className="mt-2 text-lg font-bold text-slate-900">{c.name}</h2>
            <p className="mt-1 text-sm font-medium text-slate-600">{c.tagline}</p>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">{c.summary}</p>

            <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
              {c.facts.map((f) => (
                <div key={f.label}>
                  <div className="text-sm font-bold text-slate-800">{f.value}</div>
                  <div className="text-[11px] text-slate-400">{f.label}</div>
                </div>
              ))}
            </div>

            <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 group-hover:gap-2 transition-all">
              체험 시작 <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">이 시연이 보여주는 것</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            생산 과정 자체가 아니라, 생산품이 실제 세상에 나갔을 때 생기는 문제를 다룹니다.
            물류센터의 돌발 대응, 콘텐츠의 채널별 반응, 조리의 실패 반복 — 모두 실습으로는
            겪기 어려운 경험을 화면 안에서 안전하게 반복합니다. 실제 수업에서는 각 결과가
            YNCSPOT 포트폴리오로 자동 축적됩니다.
          </p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" /> 홈으로
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        {BRAND.copyright}
      </footer>
    </div>
  );
}
