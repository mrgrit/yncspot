import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, Menu, Sparkles } from "lucide-react";
import { BRAND } from "@/config/brand";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABEL } from "./nav";
import { fromNow } from "@/lib/utils";
import { recentActivity } from "@/lib/selectors";

export function Topbar({ onMenu }: { onMenu?: () => void }) {
  const { account } = useAuth();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur">
      <div className="flex items-center gap-2">
        {onMenu && (
          <button
            onClick={onMenu}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="메뉴"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-800 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-base font-bold text-slate-900">
            {BRAND.displayName}
          </span>
          <span className="hidden text-xs text-slate-400 sm:inline">
            {BRAND.systemName}
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-1">
        <NotificationBell />
        {account && (
          <Badge variant="brand" className="hidden sm:inline-flex">
            {ROLE_LABEL[account.role]}
          </Badge>
        )}
        <UserMenu />
      </div>
    </header>
  );
}

function NotificationBell() {
  const { account } = useAuth();
  const { db, markAllNotificationsRead } = useData();
  const [open, setOpen] = React.useState(false);

  const items = React.useMemo(() => {
    if (account?.userId) {
      return db.notifications
        .filter((n) => n.userId === account.userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 8)
        .map((n) => ({ id: n.id, title: n.title, body: n.body, at: n.createdAt, read: n.read }));
    }
    return recentActivity(db, 8).map((e) => ({
      id: e.id,
      title: "운영 이벤트",
      body: e.text,
      at: e.at,
      read: true,
    }));
  }, [account?.userId, db]);

  const unread = account?.userId
    ? db.notifications.filter((n) => n.userId === account.userId && !n.read).length
    : 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100"
        aria-label="알림"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <span className="text-sm font-semibold text-slate-700">알림</span>
              {account?.userId && unread > 0 && (
                <button
                  onClick={() => markAllNotificationsRead(account.userId!)}
                  className="text-xs text-brand-700 hover:underline"
                >
                  모두 읽음
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">
                  알림이 없습니다
                </p>
              ) : (
                items.map((n) => (
                  <div
                    key={n.id}
                    className={`border-b border-slate-50 px-4 py-2.5 ${n.read ? "" : "bg-brand-50/40"}`}
                  >
                    <p className="text-sm font-medium text-slate-800">{n.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{n.body}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{fromNow(n.at)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function UserMenu() {
  const { account, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  if (!account) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100"
      >
        <Avatar name={account.name} size="sm" />
        <span className="hidden max-w-28 truncate text-sm font-medium text-slate-700 md:inline">
          {account.name}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">{account.name}</p>
              <p className="text-xs text-slate-400">{ROLE_LABEL[account.role]}</p>
            </div>
            <button
              onClick={() => {
                logout();
                setOpen(false);
                navigate("/login");
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" /> 로그아웃
            </button>
          </div>
        </>
      )}
    </div>
  );
}
