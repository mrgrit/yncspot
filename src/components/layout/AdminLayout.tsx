import * as React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { X } from "lucide-react";
import { BRAND } from "@/config/brand";
import { cn } from "@/lib/utils";
import { Topbar } from "./Topbar";
import { ADMIN_NAV } from "./nav";

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Topbar onMenu={() => setMobileOpen(true)} />

      <div className="flex">
        {/* 데스크탑 사이드바 */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 border-r border-slate-200 bg-white p-3 lg:block">
          <SidebarNav />
        </aside>

        {/* 모바일 슬라이드오버 */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-slate-900/40"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute left-0 top-0 h-full w-64 bg-white p-3 shadow-xl">
              <div className="mb-2 flex items-center justify-between px-2 py-1">
                <span className="font-bold text-slate-900">{BRAND.displayName}</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="space-y-1">
      {ADMIN_NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-brand-50 text-brand-800"
                : "text-slate-600 hover:bg-slate-100"
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
