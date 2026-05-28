import * as React from "react";
import { db as seedDb } from "@/data";
import type { ChatSession, Company, Counseling, Dataset, Enrollment, SpotHistory } from "@/types";

interface DataContextValue {
  db: Dataset;
  appliedSpots: Set<string>;
  enrolledCourses: Set<string>;
  appliedJobs: Set<string>;
  submittedAiJobs: Set<string>;
  applySpot: (jobId: string) => void;
  enrollCourse: (userId: string, courseId: string) => void;
  applyJob: (jobId: string) => void;
  submitAiTask: (userId: string, jobId: string, baseWage: number) => void;
  addCompany: (company: Company) => void;
  addChatSession: (session: ChatSession) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (userId: string) => void;
  // 상담 (운영자 등록/수정)
  addCounseling: (data: Omit<Counseling, "id">) => void;
  updateCounseling: (
    id: string,
    patch: Partial<Omit<Counseling, "id" | "userId">>
  ) => void;
}

const DataContext = React.createContext<DataContextValue | null>(null);

let enrSeq = 100000;
let sphSeq = 900000;
let cnsSeq = 800000;

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = React.useState<Dataset>(seedDb);
  const [appliedSpots, setAppliedSpots] = React.useState<Set<string>>(new Set());
  const [enrolledCourses, setEnrolledCourses] = React.useState<Set<string>>(new Set());
  const [appliedJobs, setAppliedJobs] = React.useState<Set<string>>(new Set());
  const [submittedAiJobs, setSubmittedAiJobs] = React.useState<Set<string>>(new Set());

  const applySpot = React.useCallback((jobId: string) => {
    setAppliedSpots((prev) => new Set(prev).add(jobId));
  }, []);

  // AI 검수 작업 제출 → 자동 통과(mock) + 보상 이력 기록
  const submitAiTask = React.useCallback(
    (userId: string, jobId: string, baseWage: number) => {
      setSubmittedAiJobs((prev) => new Set(prev).add(jobId));
      setDb((prev) => {
        const now = new Date().toISOString();
        const record: SpotHistory = {
          id: `sph_${++sphSeq}`,
          userId,
          jobId,
          startedAt: now,
          completedAt: now,
          baseWage,
          bonusType: null,
          bonusAmount: 0,
          totalPaid: baseWage,
          rating: 5,
          feedback: "AI 검수 작업 자동 통과 (mock)",
          successSequence: null,
        };
        return { ...prev, spotHistory: [...prev.spotHistory, record] };
      });
    },
    []
  );

  const applyJob = React.useCallback((jobId: string) => {
    setAppliedJobs((prev) => new Set(prev).add(jobId));
  }, []);

  const enrollCourse = React.useCallback((userId: string, courseId: string) => {
    setEnrolledCourses((prev) => new Set(prev).add(courseId));
    setDb((prev) => {
      const enrollment: Enrollment = {
        id: `enr_${++enrSeq}`,
        userId,
        courseId,
        attendanceRate: 0,
        score: 0,
        status: "in_progress",
        enrolledAt: new Date().toISOString(),
      };
      return { ...prev, enrollments: [...prev.enrollments, enrollment] };
    });
  }, []);

  const addCompany = React.useCallback((company: Company) => {
    setDb((prev) => ({ ...prev, companies: [...prev.companies, company] }));
  }, []);

  const addChatSession = React.useCallback((session: ChatSession) => {
    setDb((prev) => ({ ...prev, chatSessions: [...prev.chatSessions, session] }));
  }, []);

  const markNotificationRead = React.useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  }, []);

  const markAllNotificationsRead = React.useCallback((userId: string) => {
    setDb((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.userId === userId ? { ...n, read: true } : n
      ),
    }));
  }, []);

  const addCounseling = React.useCallback(
    (data: Omit<Counseling, "id">) => {
      setDb((prev) => ({
        ...prev,
        counselings: [{ id: `cns_${++cnsSeq}`, ...data }, ...prev.counselings],
      }));
    },
    []
  );

  const updateCounseling = React.useCallback(
    (id: string, patch: Partial<Omit<Counseling, "id" | "userId">>) => {
      setDb((prev) => ({
        ...prev,
        counselings: prev.counselings.map((c) =>
          c.id === id ? { ...c, ...patch } : c
        ),
      }));
    },
    []
  );

  const value: DataContextValue = {
    db,
    appliedSpots,
    enrolledCourses,
    appliedJobs,
    submittedAiJobs,
    applySpot,
    enrollCourse,
    applyJob,
    submitAiTask,
    addCompany,
    addChatSession,
    markNotificationRead,
    markAllNotificationsRead,
    addCounseling,
    updateCounseling,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = React.useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
