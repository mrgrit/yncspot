import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Topbar } from "./Topbar";
import { YOUTH_NAV } from "./nav";

export function YouthLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Topbar />

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-4 sm:pb-10">
        {/* 데스크탑/태블릿 상단 탭 네비 (흐름 내 배치) */}
        <nav className="mb-4 hidden gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm sm:flex">
          {YOUTH_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive ? "bg-brand-50 text-brand-800" : "text-slate-500 hover:bg-slate-50"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <Outlet />
      </main>

      {/* 하단 모바일 네비 */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-3xl">
          {YOUTH_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px]",
                  isActive ? "text-brand-800" : "text-slate-400"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
