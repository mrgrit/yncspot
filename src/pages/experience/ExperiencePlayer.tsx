import * as React from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, ExternalLink, Maximize2 } from "lucide-react";
import { BRAND } from "@/config/brand";
import { BrandIcon } from "@/components/BrandLogo";
import { findCourse } from "@/data/experience";

export default function ExperiencePlayer() {
  const { id } = useParams();
  const course = findCourse(id);
  const [open, setOpen] = React.useState(false);
  const frameRef = React.useRef<HTMLIFrameElement>(null);

  if (!course) return <Navigate to="/experience" replace />;

  const fullscreen = () => {
    frameRef.current?.requestFullscreen?.();
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/experience"
            className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">수업 체험</span>
          </Link>
          <div className="h-5 w-px bg-slate-200" />
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${course.accent.icon}`}
          >
            <course.icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-slate-900">{course.name}</div>
            <div className="truncate text-[11px] text-slate-400">{course.major}</div>
          </div>
        </div>
        <Link to="/" className="hidden items-center gap-2 sm:flex">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-800 text-white">
            <BrandIcon className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold text-slate-900">{BRAND.displayName}</span>
        </Link>
      </header>

      {/* 설명 (접이식) */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-700">{course.tagline}</p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setOpen((v) => !v)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                aria-expanded={open}
              >
                수업 설명
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
                />
              </button>
              <button
                onClick={fullscreen}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <Maximize2 className="h-3.5 w-3.5" /> 전체화면
              </button>
              <a
                href={course.sim}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <ExternalLink className="h-3.5 w-3.5" /> 새 탭
              </a>
            </div>
          </div>

          {open && (
            <div className="mt-3 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
              <div className="sm:col-span-2 space-y-2">
                {course.description.map((p, i) => (
                  <p key={i} className="text-[13px] leading-relaxed text-slate-600">
                    {p}
                  </p>
                ))}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500">이 화면에서 하는 일</div>
                <ul className="mt-2 space-y-1.5">
                  {course.doing.map((d, i) => (
                    <li key={i} className="flex gap-1.5 text-[12px] leading-relaxed text-slate-500">
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${course.accent.bar}`} />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 시뮬레이터 */}
      <main className="flex-1">
        <iframe
          ref={frameRef}
          key={course.id}
          src={course.sim}
          title={`${course.name} 시뮬레이터`}
          className="h-full min-h-[calc(100vh-8rem)] w-full border-0 bg-white"
        />
      </main>
    </div>
  );
}
