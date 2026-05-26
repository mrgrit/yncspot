import { Outlet } from "react-router-dom";
import { Topbar } from "./Topbar";

export function CompanyLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Topbar />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
