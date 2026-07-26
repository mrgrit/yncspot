import {
  Boxes,
  ChefHat,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

/**
 * 수업 체험하기 — 전공별 X+AI 교육 접목 계획(안)의 시연용 시뮬레이터 메타데이터.
 * 각 과정의 시뮬레이터는 public/sims/*.html 에 자체 완결형으로 존재하며,
 * ExperiencePlayer 가 iframe 으로 로드합니다.
 */
export interface ExperienceCourse {
  /** URL slug + 시뮬레이터 파일명 */
  id: "logistics" | "content" | "chef";
  /** 화면 표기명 */
  name: string;
  /** 전공/직무 라인 */
  major: string;
  /** 한 줄 소개 */
  tagline: string;
  /** 카드 요약 */
  summary: string;
  /** 상세 설명 문단 (계획서 기반) */
  description: string[];
  /** "이 화면에서 하는 일" 요점 */
  doing: string[];
  /** 카드/헤더 지표 */
  facts: { label: string; value: string }[];
  /** 시뮬레이터 정적 경로 */
  sim: string;
  /** 원본 시연 자료(구글드라이브) */
  source: string;
  icon: LucideIcon;
  /** 테마 색 (tailwind 유틸 조합용) */
  accent: {
    ring: string;
    chip: string;
    icon: string;
    bar: string;
  };
}

export const EXPERIENCE_COURSES: ExperienceCourse[] = [
  {
    id: "logistics",
    name: "AI물류 팀캡틴",
    major: "물류자동화 현장관리자",
    tagline: "실패해도 되는 물류센터에서 판단을 연습한다",
    summary:
      "정상 운영을 지켜보다 예고 없이 돌발상황이 터집니다. 제한 시간 안에 대응을 선택하고, 그 선택이 만든 결과를 숫자로 확인합니다.",
    description: [
      "현장관리자의 핵심 역량은 정상 운영이 아니라 돌발상황 판단에 있습니다. 현행 교육은 시스템 조작법과 절차 암기 중심이라, 판단력은 결국 현장 경험에만 의존하게 됩니다. 그러나 실제 현장에서는 실패를 경험시킬 수 없습니다 — 훈련 기회가 구조적으로 없는 영역입니다.",
      "이 시뮬레이터는 물류센터 운영을 화면으로 재현하고, 돌발상황을 일부러 일으켜, 학습자가 직접 대응을 결정하게 합니다. 정답을 알려주지 않습니다. 자기 판단이 어떤 결과를 냈는지 보고 사후에 되짚습니다. 인터넷 브라우저만 있으면 장비 없이 실습할 수 있습니다.",
      "인공지능은 상황을 요약하고 대응안을 제시하되, 학습자가 검증한 뒤 선택하도록 설계되어 있습니다. 일부러 잘못된 제안을 섞어 두어, 직무 판단력과 '인공지능을 의심하며 쓰는 능력'을 함께 훈련합니다.",
    ],
    doing: [
      "상황 브리핑 → 정상 운영 관찰 → 돌발상황 발생 → 대응 선택 → 결과 확인 → 사후 검토",
      "돌발상황 유형: 설비 고장 · 재고 불일치 · 인력 결원 · 물량 급증 · 전산/보안 장애 · 환경/외부 변수",
      "탐지 시간 · 대응 시간 · 마감 준수 · 안전 위반이 자동 기록되어 판단 취약점을 추적",
    ],
    facts: [
      { label: "돌발상황", value: "15종+" },
      { label: "AI 개입 수준", value: "3단계" },
      { label: "대상", value: "재직자·재학생" },
    ],
    sim: "/sims/logistics.html",
    source:
      "https://drive.google.com/file/d/1jpTGoHybdyN7HD_CEKij46DGnPdvcotZ/view?usp=drive_link",
    icon: Boxes,
    accent: {
      ring: "hover:border-slate-400",
      chip: "bg-slate-100 text-slate-600",
      icon: "bg-slate-800 text-white",
      bar: "bg-slate-800",
    },
  },
  {
    id: "content",
    name: "AI콘텐츠크리에이터",
    major: "AI 콘텐츠 · 디자인",
    tagline: "내 작품 하나를 여러 채널에 내보내고 반응까지 확인한다",
    summary:
      "직접 그린 원화 하나로 이모티콘·굿즈·웹툰·썸네일·책 표지를 만들어 여러 채널에 올리고, 반응을 읽고 다음 작업을 고치는 전 과정을 한 학기에 경험합니다.",
    description: [
      "학생 대부분은 '만드는 것'까지만 배우고 졸업합니다. 어디에 어떻게 내보내고, 반응을 어떻게 읽는지는 배울 기회가 없습니다. 이 수업은 원본 하나를 여러 곳으로 내보내는 one source multi use 전 과정을 다룹니다.",
      "실제로 올라가는 채널(인스타그램·유튜브 쇼츠·블로그·라인 스티커·OGQ 이모티콘·굿즈샵·POD 자가출판)과, 현실에서 바로 어렵기에 인공지능이 상대역을 맡는 가상 체험(전시회·출판사 미팅)을 함께 경험합니다. 심사에서 떨어지고 고쳐서 다시 내는 경험을 학교 안에서 안전하게 해볼 수 있습니다.",
      "학생이 직접 그린 원화가 없으면 진행되지 않도록 막아 둡니다. 인공지능은 규격 변환·채널별 각색·문구 작성 같은 반복 작업만 담당하고, 평가 대상은 그림의 완성도와 채널별 판단입니다. 수익은 기록만 하고 성적에 넣지 않으며, 자동 업로드는 학생 승인을 거친 뒤에만 실행됩니다.",
    ],
    doing: [
      "컨셉 고르기 → 내 그림 올리기(필수) → 규격 맞추기 → 채널 배치 → 한 번에 올리기 → 반응 보기",
      "채널마다 담당 에이전트를 배치하고 말투·분량·발행 주기를 조정하면 결과물이 즉시 바뀜",
      "포트폴리오에 '올렸고 이런 반응이 있었습니다'가 실제 숫자로 남음",
    ],
    facts: [
      { label: "발행 채널", value: "실제+가상" },
      { label: "핵심", value: "반응→개선" },
      { label: "시작", value: "이모티콘" },
    ],
    sim: "/sims/content.html",
    source:
      "https://drive.google.com/file/d/1sS7pzSUd4LApBJbxNjExa9nIC2WLLvxZ/view?usp=drive_link",
    icon: Sparkles,
    accent: {
      ring: "hover:border-pink-300",
      chip: "bg-pink-50 text-pink-600",
      icon: "bg-pink-500 text-white",
      bar: "bg-pink-500",
    },
  },
  {
    id: "chef",
    name: "AI쉐프",
    major: "제빵 · 식음료 · 양식",
    tagline: "주문 맞춤 조리를 재현하고, 그 판단 기준을 학생이 직접 만든다",
    summary:
      "손님이 취향을 고르면 그에 맞는 배합·공정 조건을 계산해 결과를 화면에 보여줍니다. 숫자를 바꾸면 결과가 바로 달라지고, 과발효·과다추출 같은 실패도 안전하게 반복해 볼 수 있습니다.",
    description: [
      "실습은 재료비와 시간 때문에 반복이 불가능합니다. 가수율을 3%씩 바꿔가며 열 번 구워보는 학습은 실습실에서 할 수 없습니다. 화면에서는 수백 번 시도할 수 있고, 실패도 안전하게 반복해서 볼 수 있습니다.",
      "핵심은 '컴퓨터가 아는 것이 아니라 교수님이 아는 것'입니다. \"쫄깃하게\"가 가수율 몇 %인지, 수율 몇 %부터 과다추출인지는 전공자만 판단할 수 있습니다. 이 판단을 표로 정리하는 것이 프로그램의 알맹이이며, 이 화면에서는 그 판단 기준표를 학생이 직접 편집합니다.",
      "커피(에스프레소)부터 시작합니다 — 수율과 농도를 기기로 정확히 잴 수 있어 가장 적합합니다. 이후 제빵(식빵), 양식(스테이크) 순으로 확대합니다.",
    ],
    doing: [
      "주문(고객 취향) → 변환된 레시피(직접 편집) → 제작 → 결과 채점 → 실험 기록",
      "변환 규칙과 채점 기준을 학생이 직접 정의 — 판단 기준이 곧 학습 결과물",
      "랜덤 손님 주문 챌린지로 수백 번 반복 연습",
    ],
    facts: [
      { label: "품목", value: "커피·빵·스테이크" },
      { label: "핵심", value: "판단 기준 편집" },
      { label: "시작", value: "에스프레소" },
    ],
    sim: "/sims/chef.html",
    source:
      "https://drive.google.com/file/d/1LIdv2KD7l9vrf1gP_gX3m2rpTgQ9upTh/view?usp=drive_link",
    icon: ChefHat,
    accent: {
      ring: "hover:border-amber-300",
      chip: "bg-amber-50 text-amber-700",
      icon: "bg-amber-600 text-white",
      bar: "bg-amber-600",
    },
  },
];

export function findCourse(id: string | undefined): ExperienceCourse | undefined {
  return EXPERIENCE_COURSES.find((c) => c.id === id);
}
