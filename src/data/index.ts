/**
 * 데이터셋 단일 생성 지점.
 * 앱 전체에서 `import { db } from "@/data"` 로 동일한 인스턴스를 공유한다.
 * (Part 2 에서 DataContext 가 이 db 를 초기 상태로 사용)
 */
import { generateDataset } from "./seed";
import type { Dataset } from "@/types";

export const db: Dataset = generateDataset();

/** 각 엔티티 건수 요약 (시드 점검/대시보드용) */
export function datasetCounts(d: Dataset = db): Record<string, number> {
  return {
    users: d.users.length,
    instructors: d.instructors.length,
    employers: d.employers.length,
    mentors: d.mentors.length,
    programs: d.programs.length,
    courses: d.courses.length,
    enrollments: d.enrollments.length,
    spotJobs: d.spotJobs.length,
    spotHistory: d.spotHistory.length,
    companies: d.companies.length,
    jobPostings: d.jobPostings.length,
    mentorships: d.mentorships.length,
    badges: d.badges.length,
    portfolios: d.portfolios.length,
    chatSessions: d.chatSessions.length,
    placements: d.placements.length,
    notifications: d.notifications.length,
    counselings: d.counselings.length,
  };
}

export { generateDataset } from "./seed";
