/**
 * 더미 데이터용 한국형 데이터 풀 + 결정론적 RNG 헬퍼.
 * 모든 무작위성은 @faker-js/faker 에 위임하며, seed.ts 에서 faker.seed(42) 로 고정한다.
 */
import { faker } from "@faker-js/faker";

export { faker };

// ──────────────────────────────────────────────
// RNG 헬퍼 (faker 기반, seed 고정 시 결정론적)
// ──────────────────────────────────────────────
export const pick = <T>(arr: readonly T[]): T =>
  faker.helpers.arrayElement(arr as T[]);

export const picks = <T>(arr: readonly T[], n: number): T[] =>
  faker.helpers.arrayElements(arr as T[], n);

export const int = (min: number, max: number): number =>
  faker.number.int({ min, max });

export const float = (min: number, max: number, digits = 1): number =>
  faker.number.float({ min, max, fractionDigits: digits });

/** 확률 p (0~1) 로 true */
export const chance = (p: number): boolean =>
  faker.number.float({ min: 0, max: 1, fractionDigits: 6 }) < p;

export const weighted = <T>(items: { weight: number; value: T }[]): T =>
  faker.helpers.weightedArrayElement(items);

/** 정규분포 정수 (Box-Muller), [min,max] 로 클램프 */
export function gaussianInt(
  mean: number,
  sd: number,
  min: number,
  max: number
): number {
  const u1 = Math.max(1e-9, faker.number.float({ min: 0, max: 1, fractionDigits: 9 }));
  const u2 = faker.number.float({ min: 0, max: 1, fractionDigits: 9 });
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.min(max, Math.max(min, Math.round(mean + z * sd)));
}

export function dateBetween(from: string, to: string): Date {
  const f = new Date(from).getTime();
  const t = new Date(to).getTime();
  if (Number.isNaN(f) || Number.isNaN(t)) return new Date(t);
  if (f >= t) return new Date(t); // from > to 방어 (faker 는 예외를 던짐)
  return faker.date.between({ from: f, to: t });
}

export const iso = (d: Date): string => d.toISOString();
export const isoDate = (d: Date): string => d.toISOString().slice(0, 10);

/** prefix_001 형태 ID 생성기 */
export function idFactory(prefix: string) {
  let n = 0;
  return () => `${prefix}_${String(++n).padStart(3, "0")}`;
}

/** 사업 운영 기간 기준점 */
export const PERIOD = {
  start: "2026-01-01",
  end: "2026-05-25",
  signupStart: "2026-01-01",
  signupEnd: "2026-05-20",
} as const;

/** 신규가입 월별 가중치 (자연스러운 증가 곡선) */
export const SIGNUP_MONTH_WEIGHTS = [
  { weight: 10, value: 1 }, // Jan
  { weight: 15, value: 2 }, // Feb
  { weight: 20, value: 3 }, // Mar
  { weight: 25, value: 4 }, // Apr
  { weight: 30, value: 5 }, // May
];

/** 월 가중 + 일 무작위로 2026년 가입일 생성 */
export function weightedSignupDate(): Date {
  const month = weighted(SIGNUP_MONTH_WEIGHTS);
  const maxDay = month === 5 ? 20 : 28;
  const day = int(1, maxDay);
  const hour = int(8, 22);
  const min = int(0, 59);
  return new Date(2026, month - 1, day, hour, min);
}

// ──────────────────────────────────────────────
// 한국 이름 풀 (성 × 이름 조합 → 충분한 고유 조합)
// ──────────────────────────────────────────────
export const SURNAMES = [
  "김", "이", "박", "최", "정", "강", "조", "윤", "장", "임",
  "한", "오", "서", "신", "권", "황", "안", "송", "류", "전",
  "홍", "고", "문", "양", "손",
];

export const GIVEN_NAMES = [
  "민준", "서연", "도윤", "하은", "시우", "지호", "주원", "지후", "준서", "예준",
  "지유", "수아", "서윤", "지우", "하준", "은우", "유진", "지민", "현우", "우진",
  "건우", "민서", "서아", "다은", "채원", "지아", "수빈", "예은", "가은", "윤서",
  "시현", "준우", "도현", "지환", "승현", "예진", "소율", "하린", "연우", "지원",
];

// ──────────────────────────────────────────────
// 대구 남구 주소 풀 (20) — 영남이공대(대구 남구 대명동) 인근
// ──────────────────────────────────────────────
export const DAEGU_ADDRESSES = [
  "대구광역시 남구 대명동 123-4",
  "대구광역시 남구 대명동 56-7",
  "대구광역시 남구 봉덕동 88-1",
  "대구광역시 남구 봉덕동 201-3",
  "대구광역시 남구 이천동 45-9",
  "대구광역시 남구 이천동 12-6",
  "대구광역시 남구 대명동 77-2",
  "대구광역시 남구 봉덕동 33-5",
  "대구광역시 남구 대명동 90-8",
  "대구광역시 남구 대명동 310-2",
  "대구광역시 남구 대명동 144-11",
  "대구광역시 남구 봉덕동 5-14",
  "대구광역시 남구 이천동 220-1",
  "대구광역시 남구 대명동 102-7",
  "대구광역시 남구 봉덕동 61-3",
  "대구광역시 남구 대명동 78-19",
  "대구광역시 남구 안지랑로 132-8",
  "대구광역시 남구 이천동 9-2",
  "대구광역시 남구 앞산순환로 47-6",
  "대구광역시 남구 대명동 250-5",
];

// ──────────────────────────────────────────────
// 관심 직무 풀 (앞 5개는 Spot 카테고리와 부분일치 → 매칭 점수 발생)
// ──────────────────────────────────────────────
export const INTERESTS = [
  "카페", "매장", "행사", "데이터", "포장",
  "디자인", "마케팅", "콘텐츠", "영상편집", "요리·베이커리",
  "물류", "회계", "고객서비스", "프로그래밍", "AI",
];

// ──────────────────────────────────────────────
// Spot 카테고리 ↔ 발주처 업종
// ──────────────────────────────────────────────
export const SPOT_CATEGORY_BY_EMPLOYER: Record<string, string> = {
  카페: "카페보조",
  매장: "매장정리",
  행사대행: "행사도우미",
  물류: "단순포장",
  데이터입력: "데이터입력",
};

export const SPOT_JOB_TITLES: Record<string, string[]> = {
  카페보조: ["주말 카페 홀서빙", "오전 카페 음료 제조 보조", "카페 마감 정리"],
  매장정리: ["의류매장 진열 보조", "매장 재고 정리", "주말 매장 운영 지원"],
  행사도우미: ["기업 채용박람회 안내", "주말 행사 부스 운영", "지역 축제 진행 보조"],
  단순포장: ["택배 분류·포장", "물류센터 단순 포장", "굿즈 패키징 작업"],
  데이터입력: ["설문 응답 데이터 입력", "엑셀 자료 정리", "고객 명단 정리"],
};

export const EMPLOYER_DISTRICTS = ["남구", "수성구", "중구", "달서구", "동구"];

export const EMPLOYER_NAME_PARTS: Record<string, string[]> = {
  카페: ["앞산", "대명", "봉덕", "안지랑", "영대", "이천"],
  매장: ["스타일", "데일리", "라이프", "어반"],
  행사대행: ["비즈", "프라임", "온스테이지"],
  물류: ["대구물류", "스마트박스", "패스트팩"],
  데이터입력: ["데이터웍스", "정보처리", "타이핑랩", "엔트리데이터"],
};

// ──────────────────────────────────────────────
// 수료생 포트폴리오용 풀 (캡스톤·실습·학습)
// ──────────────────────────────────────────────
export const CAPSTONE_THEME = {
  try_job: [
    "지역 소상공인 주문관리 웹앱",
    "AI 추천 기반 동네 맛집 큐레이션",
    "청년 일경험 매칭 풀스택 프로젝트",
  ],
  get_job: [
    "물류 배차 최적화 대시보드",
    "AI 베이커리 수요예측 시스템",
    "숏폼 콘텐츠 자동 자막 파이프라인",
  ],
} as const;

export const PRACTICE_PROJECTS = [
  "주간 매출 데이터 분석 실습",
  "반응형 랜딩페이지 클론 코딩",
  "AI 카피라이팅 10종 제작",
  "베이커리 신메뉴 레시피 카드",
  "물류 동선 시뮬레이션 리포트",
  "고객 설문 데이터 정제·시각화",
  "브랜드 SNS 콘텐츠 캘린더",
];

export const LEARNINGS = [
  "React 컴포넌트 설계",
  "데이터 시각화(Recharts)",
  "프롬프트 엔지니어링 기초",
  "Git 협업 워크플로",
  "SQL 기본 쿼리",
  "디자인 시스템 활용",
  "고객 응대 커뮤니케이션",
  "엑셀 데이터 가공",
  "AI 도구 활용 실무",
  "포트폴리오 구성·발표",
];

// ──────────────────────────────────────────────
// 평가/피드백/멘토링 토픽
// ──────────────────────────────────────────────
export const SPOT_FEEDBACKS = [
  "성실하게 끝까지 임해주셨습니다.",
  "시간 약속을 잘 지켜주셨어요.",
  "응대가 친절했습니다.",
  "꼼꼼하게 작업해주셨습니다.",
  "다음에도 함께 일하고 싶어요.",
  "분위기를 잘 살려주셨습니다.",
  "빠르고 정확하게 처리했습니다.",
];

export const MENTORING_TOPICS = [
  "이력서·자기소개서 첨삭",
  "직무 역량 진단",
  "면접 준비 코칭",
  "포트폴리오 리뷰",
  "현직자 직무 소개",
  "커리어 로드맵 설계",
  "산업 동향 브리핑",
];

export const AVATAR_COLORS = [
  "#1E40AF", "#F59E0B", "#10B981", "#8B5CF6", "#0EA5E9",
  "#EC4899", "#14B8A6", "#6366F1", "#EF4444", "#F97316",
];

// ──────────────────────────────────────────────
// AI 챗 샘플 (ChatSession 시드용)
// ──────────────────────────────────────────────
export const CHAT_SAMPLES: { title: string; turns: { q: string; a: string }[] }[] = [
  {
    title: "이수 요건 문의",
    turns: [
      {
        q: "AX 마케터 도약 이수하려면 뭐 더 들어야 해요?",
        a: "(현재 상태) AI공통 영역은 이수하셨고 실전·전문 영역이 진행 중입니다.\n(제안) 교양·사회 영역 1과목을 함께 들으면 3영역 동시이수 요건이 충족됩니다.\n(다음 액션) '나의자산관리'(교양) 수강신청을 추천드립니다.",
      },
    ],
  },
  {
    title: "Spot 추천 요청",
    turns: [
      {
        q: "이번 주 나한테 맞는 Spot 찾아줘",
        a: "(현재 상태) Silver 등급, 관심사는 카페·행사입니다.\n(제안) 등급·위치·관심사 기준 상위 3건을 골랐습니다.\n(다음 액션) '주말 카페 홀서빙', '기업 채용박람회 안내', '카페 마감 정리'를 확인해 보세요.",
      },
    ],
  },
  {
    title: "진로 시뮬레이션",
    turns: [
      {
        q: "쿠팡 CFS 지원하려면 뭐가 필요해요?",
        a: "(현재 상태) 물류 관심사가 있으나 관련 이수 이력이 부족합니다.\n(제안) 'AI Logistics 과정' 이수와 단순포장 Spot 경험 누적을 권장합니다.\n(다음 액션) Get Job 트랙 전환 후 해당 과정을 신청하세요.",
      },
    ],
  },
];
