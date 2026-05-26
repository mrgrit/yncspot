import * as React from "react";
import { db } from "@/data";

export type AppRole = "youth" | "operator" | "company" | "admin";

export interface Account {
  role: AppRole;
  name: string;
  userId?: string; // youth 일 때 db.users 참조
  companyId?: string; // company 일 때 db.companies 참조
}

interface AuthContextValue {
  account: Account | null;
  login: (role: AppRole) => void;
  logout: () => void;
  setYouthUserId: (id: string) => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "ync-jump-spot.auth";

/** 데이터가 풍부한 대표 데모 참여자 선정 */
function pickDemoYouthId(): string {
  const hasBadge = new Set(db.badges.map((b) => b.userId));
  const hasEnr = new Set(db.enrollments.map((e) => e.userId));
  const cand = db.users.find(
    (u) =>
      u.track === "try_job" &&
      u.spotGrade === "silver" &&
      u.spotCount >= 5 &&
      hasBadge.has(u.id) &&
      hasEnr.has(u.id)
  );
  return (cand ?? db.users[0]).id;
}

function buildAccount(role: AppRole): Account {
  switch (role) {
    case "youth": {
      const id = pickDemoYouthId();
      const u = db.users.find((x) => x.id === id);
      return { role, name: u?.name ?? "참여자", userId: id };
    }
    case "operator":
      return { role, name: "사업단 운영자" };
    case "admin":
      return { role, name: "시스템 관리자" };
    case "company": {
      const c = db.companies[0];
      return { role, name: `${c?.name ?? "협약기업"} 채용담당`, companyId: c?.id };
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = React.useState<Account | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Account) : null;
    } catch {
      return null;
    }
  });

  const persist = (a: Account | null) => {
    try {
      if (a) localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Artifact 등 storage 불가 환경: 메모리만 사용 */
    }
  };

  const login = React.useCallback((role: AppRole) => {
    const a = buildAccount(role);
    setAccount(a);
    persist(a);
  }, []);

  const logout = React.useCallback(() => {
    setAccount(null);
    persist(null);
  }, []);

  const setYouthUserId = React.useCallback((id: string) => {
    setAccount((prev) => {
      if (!prev) return prev;
      const u = db.users.find((x) => x.id === id);
      const next = { ...prev, userId: id, name: u?.name ?? prev.name };
      persist(next);
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ account, login, logout, setYouthUserId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
