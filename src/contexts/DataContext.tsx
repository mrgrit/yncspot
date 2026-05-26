import * as React from "react";
import { db as seedDb } from "@/data";
import type { ChatSession, Company, Dataset, Enrollment } from "@/types";

interface DataContextValue {
  db: Dataset;
  appliedSpots: Set<string>;
  enrolledCourses: Set<string>;
  appliedJobs: Set<string>;
  applySpot: (jobId: string) => void;
  enrollCourse: (userId: string, courseId: string) => void;
  applyJob: (jobId: string) => void;
  addCompany: (company: Company) => void;
  addChatSession: (session: ChatSession) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (userId: string) => void;
}

const DataContext = React.createContext<DataContextValue | null>(null);

let enrSeq = 100000;

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = React.useState<Dataset>(seedDb);
  const [appliedSpots, setAppliedSpots] = React.useState<Set<string>>(new Set());
  const [enrolledCourses, setEnrolledCourses] = React.useState<Set<string>>(new Set());
  const [appliedJobs, setAppliedJobs] = React.useState<Set<string>>(new Set());

  const applySpot = React.useCallback((jobId: string) => {
    setAppliedSpots((prev) => new Set(prev).add(jobId));
  }, []);

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

  const value: DataContextValue = {
    db,
    appliedSpots,
    enrolledCourses,
    appliedJobs,
    applySpot,
    enrollCourse,
    applyJob,
    addCompany,
    addChatSession,
    markNotificationRead,
    markAllNotificationsRead,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = React.useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
