/**
 * 교육 프로그램(12) · 교강사 · 교과목(25) 생성.
 * 프로그램은 기획서 §4 더미 명세의 12개를 그대로 반영(level/type/area 모두 명시).
 */
import type {
  Course,
  CourseFormat,
  Instructor,
  Program,
  ProgramArea,
  ProgramLevel,
  ProgramType,
  Track,
} from "@/types";
import { idFactory, int, pick, weighted } from "./pools";

interface ProgramSeed {
  name: string;
  track: Track;
  type: ProgramType;
  area: ProgramArea;
  level: ProgramLevel;
  hours: number;
  capacity: number;
  startDate: string;
  endDate: string;
}

const PROGRAM_SEEDS: ProgramSeed[] = [
  // Try Job (7)
  { name: "Spot Working", track: "try_job", type: "common", area: "social", level: "common", hours: 10, capacity: 20, startDate: "2026-02-03", endDate: "2026-02-17" },
  { name: "나의자산관리", track: "try_job", type: "common", area: "liberal", level: "common", hours: 30, capacity: 20, startDate: "2026-02-10", endDate: "2026-03-24" },
  { name: "AI 핸즈온 워크숍", track: "try_job", type: "common", area: "ai_common", level: "common", hours: 20, capacity: 20, startDate: "2026-02-17", endDate: "2026-03-17" },
  { name: "AX 쉐프 도약", track: "try_job", type: "major", area: "professional", level: "beginner", hours: 40, capacity: 10, startDate: "2026-03-02", endDate: "2026-04-13" },
  { name: "AX 크리에이터 도약", track: "try_job", type: "major", area: "professional", level: "beginner", hours: 40, capacity: 10, startDate: "2026-03-09", endDate: "2026-04-20" },
  { name: "AX 마케터 도약", track: "try_job", type: "major", area: "professional", level: "beginner", hours: 40, capacity: 10, startDate: "2026-03-16", endDate: "2026-04-27" },
  { name: "풀스택 Try Job 프로젝트", track: "try_job", type: "capstone", area: "professional", level: "intermediate", hours: 120, capacity: 10, startDate: "2026-04-06", endDate: "2026-06-26" },

  // Get Job (5)
  { name: "AI 리터러시", track: "get_job", type: "common", area: "ai_common", level: "common", hours: 20, capacity: 20, startDate: "2026-02-03", endDate: "2026-03-03" },
  { name: "AI Logistics 과정", track: "get_job", type: "major", area: "professional", level: "intermediate", hours: 120, capacity: 10, startDate: "2026-03-02", endDate: "2026-05-22" },
  { name: "AI Cooking & Bakery 과정", track: "get_job", type: "major", area: "professional", level: "intermediate", hours: 120, capacity: 10, startDate: "2026-03-09", endDate: "2026-05-29" },
  { name: "AI Contents 과정", track: "get_job", type: "major", area: "professional", level: "intermediate", hours: 120, capacity: 10, startDate: "2026-03-16", endDate: "2026-06-05" },
  { name: "Get Job 캡스톤디자인", track: "get_job", type: "capstone", area: "professional", level: "advanced", hours: 80, capacity: 10, startDate: "2026-04-13", endDate: "2026-06-19" },
];

const INSTRUCTOR_SEEDS: Omit<Instructor, "id" | "email">[] = [
  { name: "정민호 교수", specialty: "AI·데이터", bio: "전 IT기업 데이터 리드, AI 리터러시·핸즈온 담당" },
  { name: "한지수 강사", specialty: "마케팅·콘텐츠", bio: "디지털 마케팅 10년차, AX 마케터/크리에이터 과정 운영" },
  { name: "오세훈 셰프", specialty: "조리·베이커리", bio: "호텔 조리 출신, AX 쉐프·쿠킹 과정 담당" },
  { name: "윤가람 강사", specialty: "물류·SCM", bio: "물류 현장 컨설턴트, AI Logistics 과정 담당" },
  { name: "서나윤 강사", specialty: "금융·자산관리", bio: "FP 자격 보유, 나의자산관리 교양 담당" },
  { name: "강도현 멘토", specialty: "커리어·취업", bio: "취업 컨설턴트, Spot Working·캡스톤 코칭" },
  { name: "임채원 교수", specialty: "콘텐츠 제작", bio: "영상·SNS 콘텐츠 전문, AI Contents 과정 담당" },
  { name: "박선우 강사", specialty: "풀스택 개발", bio: "웹 풀스택 개발자, Try Job 프로젝트 멘토" },
];

const SCHEDULES = [
  "월/수 14:00-17:00",
  "화/목 10:00-13:00",
  "월/수/금 19:00-21:00",
  "토 09:00-13:00",
  "화/목 14:00-17:00",
];

const ONSITE_ROOMS = [
  "부산 남구 캠퍼스 201호",
  "부산 남구 캠퍼스 305호",
  "부산 남구 산학협력관 LAB",
  "부산 남구 창업보육센터 세미나실",
];

// 12개 프로그램에 배정할 교과목 수 (합계 25)
const COURSE_COUNTS = [2, 2, 2, 3, 2, 2, 3, 2, 2, 2, 2, 1];

const FORMAT_WEIGHTS: { weight: number; value: CourseFormat }[] = [
  { weight: 55, value: "onsite" },
  { weight: 30, value: "online" },
  { weight: 15, value: "flipped" },
];

export function buildPrograms(): Program[] {
  const nextId = idFactory("prg");
  return PROGRAM_SEEDS.map((s) => ({ id: nextId(), ...s }));
}

export function buildInstructors(): Instructor[] {
  const nextId = idFactory("ins");
  return INSTRUCTOR_SEEDS.map((s) => {
    const id = nextId();
    return { id, email: `${id}@jump-spot.kr`, ...s };
  });
}

export function buildCourses(
  programs: Program[],
  instructors: Instructor[]
): Course[] {
  const nextId = idFactory("crs");
  const courses: Course[] = [];
  const labels = ["A", "B", "C"];

  programs.forEach((program, pi) => {
    const count = COURSE_COUNTS[pi] ?? 1;
    for (let c = 0; c < count; c++) {
      const id = nextId();
      const format = weighted(FORMAT_WEIGHTS);
      const location =
        format === "online"
          ? "온라인 (LMS)"
          : format === "flipped"
            ? "플립드 (온라인 + 남구 캠퍼스)"
            : pick(ONSITE_ROOMS);
      courses.push({
        id,
        programId: program.id,
        name: count > 1 ? `${program.name} ${labels[c]}반` : program.name,
        instructorId: pick(instructors).id,
        format,
        location,
        schedule: pick(SCHEDULES),
        capacity: Math.max(6, Math.round(program.capacity / count) + int(0, 4)),
      });
    }
  });

  return courses;
}
