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
  "대구 남구 캠퍼스 201호",
  "대구 남구 캠퍼스 305호",
  "대구 남구 산학협력관 LAB",
  "대구 남구 창업보육센터 세미나실",
];

// 12개 프로그램에 배정할 교과목 수 (합계 25)
const COURSE_COUNTS = [2, 2, 2, 3, 2, 2, 3, 2, 2, 2, 2, 1];

const FORMAT_WEIGHTS: { weight: number; value: CourseFormat }[] = [
  { weight: 55, value: "onsite" },
  { weight: 30, value: "online" },
  { weight: 15, value: "flipped" },
];

type ProgramContent = Pick<Program, "description" | "syllabus" | "outcomes">;

const PROGRAM_CONTENT: Record<string, ProgramContent> = {
  "Spot Working": {
    description: "Spot Work의 의미와 안전·정산·매너를 익히고 첫 일경험을 준비하는 입문 과정입니다.",
    syllabus: ["Spot Work 이해와 등급제", "안전·근로 매너", "정산·보상 구조", "첫 일감 매칭 실습"],
    outcomes: ["Spot 신청·수행 절차 숙지", "기본 근로 매너 체득", "Bronze 등급 활동 시작"],
  },
  나의자산관리: {
    description: "청년을 위한 금융 생활과 자산관리 기초를 다루는 교양 과정입니다.",
    syllabus: ["예산·지출 관리", "저축·투자 기초", "신용·대출 이해", "청년 금융지원 제도"],
    outcomes: ["월 예산 계획 수립", "금융 상품 비교 능력", "청년 정책 활용"],
  },
  "AI 핸즈온 워크숍": {
    description: "생성형 AI 도구를 실무에 활용하는 핸즈온 워크숍입니다.",
    syllabus: ["생성형 AI 개요", "프롬프트 작성 실습", "문서·이미지 자동화", "업무 적용 사례"],
    outcomes: ["프롬프트 설계 능력", "AI 도구 업무 적용", "자동화 워크플로 구성"],
  },
  "AX 쉐프 도약": {
    description: "AI를 접목한 조리·메뉴 개발 실무를 배우는 전문 과정입니다.",
    syllabus: ["기초 조리·위생(HACCP)", "메뉴 원가·레시피 설계", "AI 메뉴 트렌드 분석", "실전 플레이팅"],
    outcomes: ["위생 기준 준수", "레시피 표준화", "메뉴 기획 포트폴리오"],
  },
  "AX 크리에이터 도약": {
    description: "AI 도구로 숏폼·SNS 콘텐츠를 기획·제작하는 전문 과정입니다.",
    syllabus: ["콘텐츠 기획", "AI 영상·이미지 생성", "편집 실무(Premiere)", "채널 운영 전략"],
    outcomes: ["숏폼 제작 역량", "AI 편집 워크플로", "콘텐츠 포트폴리오"],
  },
  "AX 마케터 도약": {
    description: "데이터와 AI를 활용한 디지털 마케팅 실무 과정입니다.",
    syllabus: ["디지털 마케팅 기초", "AI 카피·소재 제작", "퍼포먼스 데이터 분석", "캠페인 기획 실습"],
    outcomes: ["캠페인 기획·운영", "성과 데이터 해석", "마케팅 포트폴리오"],
  },
  "풀스택 Try Job 프로젝트": {
    description: "기획부터 배포까지 웹 서비스를 직접 만드는 풀스택 캡스톤 프로젝트입니다.",
    syllabus: ["요구사항·기획", "프론트엔드(React)", "백엔드·DB", "배포·발표"],
    outcomes: ["풀스택 서비스 1종 완성", "협업·형상관리 경험", "캡스톤 산출물 발표"],
  },
  "AI 리터러시": {
    description: "취업 준비생을 위한 AI 활용 리터러시 과정입니다.",
    syllabus: ["AI 기본 개념", "직무별 AI 활용", "AI 윤리·검증", "실무 적용 실습"],
    outcomes: ["직무 AI 활용", "결과 검증 능력", "AI 활용 사례 정리"],
  },
  "AI Logistics 과정": {
    description: "AI 기반 물류·SCM 실무를 다루는 전문 과정입니다.",
    syllabus: ["물류·SCM 개요", "수요예측·재고 최적화", "배차·동선 분석", "현장 프로젝트"],
    outcomes: ["물류 데이터 분석", "최적화 리포트 작성", "현장 적용 경험"],
  },
  "AI Cooking & Bakery 과정": {
    description: "AI를 활용한 베이커리·쿠킹 전문 실무 과정입니다.",
    syllabus: ["제과제빵 기초", "원가·수요 예측", "신메뉴 개발", "납품·운영 실습"],
    outcomes: ["제과제빵 실무", "신메뉴 포트폴리오", "수요예측 적용"],
  },
  "AI Contents 과정": {
    description: "AI 기반 콘텐츠 제작·운영 전문 과정입니다.",
    syllabus: ["콘텐츠 전략", "AI 생성·편집", "채널 그로스", "브랜디드 콘텐츠 실습"],
    outcomes: ["콘텐츠 운영 역량", "AI 제작 파이프라인", "채널 성장 사례"],
  },
  "Get Job 캡스톤디자인": {
    description: "취업 직무와 연계한 산학 캡스톤디자인 프로젝트입니다.",
    syllabus: ["문제 정의·기획", "직무 연계 설계", "구현·검증", "산학 발표"],
    outcomes: ["직무 연계 산출물", "산학 협력 경험", "취업 포트폴리오 완성"],
  },
};

function fallbackContent(s: ProgramSeed): ProgramContent {
  return {
    description: `${s.name} 과정입니다.`,
    syllabus: ["오리엔테이션", "이론·기초", "실습", "프로젝트·평가"],
    outcomes: ["핵심 개념 이해", "실무 적용", "결과물 산출"],
  };
}

export function buildPrograms(): Program[] {
  const nextId = idFactory("prg");
  return PROGRAM_SEEDS.map((s) => ({
    id: nextId(),
    ...s,
    ...(PROGRAM_CONTENT[s.name] ?? fallbackContent(s)),
  }));
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
