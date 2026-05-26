/**
 * "AI 일자리" — AI 콘텐츠/에이전트 결과를 사람이 검수하는 크라우드워크.
 * (~/aidoyak "AI Review Hub" 의 핵심: 도메인 · 검수 가이드 · 동적 출력폼 · 보상 을 이식)
 *
 * 일반 Spot 과 동일하게 SpotJob 으로 표현하되 category="AI 일자리" + aiTask 페이로드를 가진다.
 */
import type { AiTask, Employer, OutputField, SpotGrade, SpotJob } from "@/types";
import { dateBetween, idFactory, int, iso, pick, weighted, weightedSignupDate } from "./pools";

export const AI_JOB_CATEGORY = "AI 일자리";

interface AiTaskTemplate {
  title: string;
  domain: string;
  domainLabel: string;
  guideMd: string;
  fields: OutputField[];
  baseWage: number; // 건당 보상
  estimatedMin: number;
  requiredGrade: SpotGrade;
}

export const AI_TASK_TEMPLATES: AiTaskTemplate[] = [
  {
    title: "AI 신메뉴 알레르기 라벨 검수",
    domain: "food-bev",
    domainLabel: "식음료",
    guideMd: `## 검수 목표
AI가 생성한 메뉴별 **알레르기 유발물질 라벨**에 누락·오기가 없는지 검수합니다.

## 체크리스트
1. 한국 식품 표시기준 **22대 알레르기 유발물질** 기준으로 대조합니다.
2. 특히 **간장(밀·대두)**, 어패류, 견과류 누락을 주의 깊게 확인합니다.
3. 재료에 없는 항목이 라벨에 들어간 **오기**도 확인합니다.

## 판정 기준
- 누락/오기 0건 → 정확 / 1건 → 경미 / 2건↑ 또는 알레르기 핵심 누락 → 중대`,
    fields: [
      { key: "verdict", label: "전체 판정", kind: "choice_single", required: true, options: ["정확", "경미한 오류", "중대한 오류"] },
      { key: "missing", label: "누락·오기 항목", kind: "text_long", required: true, helperText: "예) 고등어조림: 간장의 밀·대두 누락" },
      { key: "confidence", label: "검수 확신도", kind: "rating", required: true },
    ],
    baseWage: 15000,
    estimatedMin: 20,
    requiredGrade: "bronze",
  },
  {
    title: "AI 복지 상담 챗봇 응답 검수",
    domain: "welfare",
    domainLabel: "사회복지",
    guideMd: `## 검수 목표
AI 복지 상담 챗봇의 응답이 **정확하고 차별·과장 표현 없이** 신청 자격/절차를 안내하는지 검수합니다.

## 체크리스트
1. 제도명·지원 금액·신청 기한 등 **사실 정확성**을 확인합니다.
2. 단정·과장("무조건 받을 수 있어요") 표현을 점검합니다.
3. 신청 절차·필요 서류 **누락** 여부를 확인합니다.`,
    fields: [
      { key: "accurate", label: "정보 정확성", kind: "yes_no", required: true },
      { key: "issues", label: "발견된 문제 유형", kind: "choice_multi", required: false, options: ["사실 오류", "부적절·차별 표현", "근거 부족", "절차 누락"] },
      { key: "suggestion", label: "개선 제안", kind: "text_long", required: true },
    ],
    baseWage: 18000,
    estimatedMin: 25,
    requiredGrade: "bronze",
  },
  {
    title: "AI 생성 보안 설정(nftables) 검토",
    domain: "security",
    domainLabel: "보안",
    guideMd: `## 검수 목표
AI가 생성한 **nftables 방화벽 규칙**에 과도 허용·위험 포트 개방이 없는지 검토합니다.

## 체크리스트
1. \`0.0.0.0/0\` 전체 허용 규칙이 있는지 확인합니다.
2. 22/3389 등 관리 포트가 외부에 열려 있는지 확인합니다.
3. \`nft list ruleset\` 출력을 그대로 첨부합니다.`,
    fields: [
      { key: "risky", label: "위험 규칙 존재", kind: "yes_no", required: true },
      { key: "command_output", label: "nft list ruleset 출력", kind: "command_output", required: true },
      { key: "verdict", label: "판정", kind: "choice_single", required: true, options: ["승인", "수정 필요", "반려"] },
    ],
    baseWage: 28000,
    estimatedMin: 35,
    requiredGrade: "silver",
  },
  {
    title: "AI 이미지 캡션 검수",
    domain: "vision",
    domainLabel: "비전",
    guideMd: `## 검수 목표
AI가 생성한 **이미지 캡션**이 실제 이미지 내용과 일치하는지, 부적절·편향 표현이 없는지 검수합니다.

## 체크리스트
1. 캡션이 이미지의 주요 객체를 정확히 기술하는지 확인합니다.
2. 성별·인종 등 **편향 표현**을 점검합니다.
3. 검수 화면을 캡처해 첨부합니다.`,
    fields: [
      { key: "screenshot", label: "검수 화면 캡처", kind: "screenshot", required: true },
      { key: "accuracy", label: "캡션 정확도", kind: "rating", required: true },
      { key: "errors", label: "오류 유형", kind: "choice_multi", required: false, options: ["객체 누락", "오인식", "편향 표현", "문법 오류"] },
    ],
    baseWage: 14000,
    estimatedMin: 15,
    requiredGrade: "bronze",
  },
  {
    title: "AI 생성 콘텐츠 사실검증",
    domain: "fact",
    domainLabel: "사실검증",
    guideMd: `## 검수 목표
AI가 작성한 글의 **핵심 주장**을 신뢰 가능한 출처와 대조해 사실 여부를 판정합니다.

## 체크리스트
1. 글에서 검증 가능한 핵심 주장 1개를 고릅니다.
2. 공신력 있는 출처(정부·언론·학술)를 찾아 대조합니다.
3. 출처 URL과 판정을 기록합니다.`,
    fields: [
      { key: "claim_1", label: "검증한 핵심 주장", kind: "text_long", required: true },
      { key: "source_1", label: "출처 URL", kind: "url", required: true },
      { key: "verdict", label: "판정", kind: "choice_single", required: true, options: ["일치", "부분일치", "불일치"] },
    ],
    baseWage: 20000,
    estimatedMin: 30,
    requiredGrade: "silver",
  },
  {
    title: "고객 문의 데이터 라벨링",
    domain: "data",
    domainLabel: "데이터",
    guideMd: `## 검수 목표
고객 문의 데이터를 **사전 정의된 카테고리로 분류**하고 결과를 JSON으로 제출합니다.

## 체크리스트
1. 문의 내용을 읽고 가장 적합한 카테고리 1개를 선택합니다.
2. 감정(긍정/부정)·긴급 여부를 JSON 으로 표기합니다.`,
    fields: [
      { key: "category", label: "분류 카테고리", kind: "choice_single", required: true, options: ["배송", "결제", "교환/환불", "제품문의", "기타"] },
      { key: "labels_json", label: "라벨 결과(JSON)", kind: "json", required: true, helperText: '예) {"sentiment":"부정","urgent":true}' },
      { key: "note", label: "비고", kind: "text_short", required: false },
    ],
    baseWage: 12000,
    estimatedMin: 12,
    requiredGrade: "bronze",
  },
];

interface AiEmployerSeed {
  name: string;
  district: string;
}
const AI_EMPLOYER_SEEDS: AiEmployerSeed[] = [
  { name: "영남이공대 AI검수랩", district: "남구" },
  { name: "대구 AI데이터센터", district: "동구" },
  { name: "DGB AI품질팀", district: "수성구" },
  { name: "대구디지털혁신진흥원 AI검수단", district: "동구" },
  { name: "ACME AI운영팀", district: "온라인" },
];

export function buildAiEmployers(): Employer[] {
  const nextId = idFactory("aemp");
  return AI_EMPLOYER_SEEDS.map((s) => ({
    id: nextId(),
    name: s.name,
    category: AI_JOB_CATEGORY,
    district: s.district,
    contactPerson: `${s.name} 담당`,
    rating: 4.6,
  }));
}

/** AI 검수 일감 생성 (모두 모집중). 템플릿 × 발주처 조합으로 다양화. */
export function buildAiSpotJobs(aiEmployers: Employer[]): SpotJob[] {
  const nextId = idFactory("aspot");
  const jobs: SpotJob[] = [];

  for (const tpl of AI_TASK_TEMPLATES) {
    const count = int(3, 5); // 템플릿당 3~5건 → 약 24건
    for (let i = 0; i < count; i++) {
      const employer = pick(aiEmployers);
      const created = weightedSignupDate();
      const scheduled = dateBetween(iso(created), "2026-06-10T09:00:00.000Z");
      const aiTask: AiTask = {
        domain: tpl.domain,
        domainLabel: tpl.domainLabel,
        guideMd: tpl.guideMd,
        fields: tpl.fields,
        estimatedMin: tpl.estimatedMin,
      };
      jobs.push({
        id: nextId(),
        employerId: employer.id,
        title: `${tpl.title} #${i + 1}`,
        description: `${employer.name}이(가) 의뢰한 '${tpl.domainLabel}' 도메인 AI 검수 작업입니다. 가이드를 따라 ${tpl.estimatedMin}분 내외로 수행합니다.`,
        category: AI_JOB_CATEGORY,
        durationMin: tpl.estimatedMin,
        baseWage: tpl.baseWage,
        requiredGrade: weighted<SpotGrade>([
          { weight: 70, value: tpl.requiredGrade },
          { weight: 30, value: "bronze" },
        ]),
        location: "온라인 (원격 검수)",
        status: "open",
        createdAt: iso(created),
        scheduledAt: iso(scheduled),
        aiTask,
      });
    }
  }
  return jobs;
}
