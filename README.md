# ync-jump-spot

> 청년도약 인재양성 부트캠프 통합 운영 시스템 — **Phase 1 MVP** (Part 1 데이터 + Part 2 화면)

부담 없는 Spot Work 진입 → 등급·보상 → 3영역 동시이수 → 포트폴리오 → 협약기업 취업까지를
하나의 플랫폼으로 연결하는 데모 시스템입니다. 모든 데이터는 결정론적 더미 데이터(`faker.seed(42)`)입니다.

> 브랜드명/테마는 [`src/config/brand.ts`](src/config/brand.ts) **한 곳**에서만 관리합니다.
> `BRAND.systemName` 만 바꿔도 헤더·로그인·랜딩·푸터 등 전체에 반영됩니다.

## 실행 방법

```bash
npm install      # 의존성 설치
npm run dev      # 개발 서버 (http://localhost:5173)
npm run build    # 타입체크(tsc) + 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
npm run typecheck
```

첫 화면(`/`)은 랜딩이며, **로그인 화면에서 데모 역할을 선택**하면 역할별 화면으로 진입합니다.
세션은 localStorage 에 저장됩니다(불가 환경이면 메모리만 사용).

| 역할 | 진입 | 주요 화면 |
|---|---|---|
| **참여자** | `/me` | 마이페이지 · Spot 게시판/상세/이력 · 교육과정 · 채용 · 포트폴리오 · 배지 · AI 챗 |
| **사업단 운영자** | `/admin` | 통합 대시보드 · 참여자 · 교육운영 · Spot운영 · 협약기업 · 취업매칭 · 보고서 |
| **협약기업** | `/company` | 인재 풀 · 채용 활동 통계 · 우리 회사 공고 |
| **시스템 관리자** | `/admin` | 운영자와 동일 권한 |

## AI 어시스턴트(API 키) 설정

`/chat` 화면의 **「API 키」** 버튼에서 Anthropic API 키를 입력하면 실제 Claude 응답을 사용합니다.
- 키 미설정/호출 실패 시 → **규칙 기반 오프라인 폴백 응답**으로 자동 동작합니다(데모 항상 작동).
- 키는 localStorage(`ync-jump-spot.anthropic_key`)에만 저장됩니다.
- 모델은 [`src/lib/ai.ts`](src/lib/ai.ts)의 `AI_MODEL` 한 곳에서 관리합니다.
- 브라우저 직접 호출을 위해 `anthropic-dangerous-direct-browser-access` 헤더를 사용합니다.
  (운영 환경에서는 키 노출 방지를 위해 백엔드 프록시 권장)

## 기술 스택

- React 18 + TypeScript + Vite 5
- Tailwind CSS 3 (shadcn/ui 스타일) · lucide-react · recharts
- @faker-js/faker (seed 고정) · react-router-dom 6
- 상태: Context(`AuthContext`, `DataContext`) + useState/useReducer
- 경로 별칭: `@/*` → `src/*`

## 디렉터리 구조

```
src/
├── config/brand.ts        # 시스템명·테마 단일 관리
├── types/index.ts         # 전역 타입(엔티티 17종)
├── data/                  # 더미 데이터 생성기 (Part 1) — db 단일 인스턴스
├── lib/
│   ├── utils.ts           # cn · 포맷터 · 한글 라벨
│   ├── reward.ts          # Spot 1·2·3차 보상 + 등급 승급 룰
│   ├── matcher.ts         # Spot 매칭 점수(최대 100)
│   ├── badgeIssuer.ts     # 디지털 배지 발급
│   ├── selectors.ts       # 화면용 집계(KPI/차트/사용자/기업/보고서)
│   └── ai.ts              # AI 컨텍스트 · Anthropic 호출 · 폴백
├── contexts/              # AuthContext(역할/세션) · DataContext(데이터/액션)
├── hooks/useMe.ts         # 현재 참여자 실시간 레코드
├── routes/guards.tsx      # Protected(역할별 접근) · homePathFor
├── components/
│   ├── ui/                # Button·Card·Input·Textarea·Select·Badge·Avatar
│   │                      #  ·Tabs·Table·Dialog·Toast·Progress·ChartCard·feedback
│   ├── charts/KpiCard.tsx # sparkline 포함 KPI 카드
│   ├── common/PageHeader  
│   ├── layout/            # AdminLayout · YouthLayout · CompanyLayout · Topbar · nav
│   └── ErrorBoundary.tsx
├── pages/
│   ├── public/            # Landing · Login(역할선택) · NotFound
│   ├── youth/             # MyPage · Portfolio · Badges · SpotBoard · SpotDetail
│   │                      #  · SpotHistory · Courses · Jobs · JobDetail · Chat
│   ├── admin/             # Dashboard · Members · AdminCourses · AdminSpotJobs
│   │                      #  · Companies · Placements · Reports
│   └── company/           # CompanyPortal
├── App.tsx                # 라우팅 + 프로바이더
└── main.tsx
```

## 시스템명/테마 변경

`src/config/brand.ts` 의 `BRAND.systemName`(및 displayName/테마 컬러)만 수정하면 전체에 반영됩니다.
모든 컴포넌트는 `import { BRAND, THEME } from "@/config/brand"` 로 접근합니다.

## 통합 대시보드 (`/admin`)

- KPI 카드 6개(누적 양성인원·활성 참여자·취업률·Spot 누적·협약기업 채용·만족도) — 각 sparkline 포함
- 월별 활동 추이(Line) · 트랙 도넛(중앙 총원) · 프로그램 이수율(가로 Bar) · 등급 분포(Stack Bar)
- 협약기업 채용 활동 테이블 · 최근 활동 피드(시간순 30건)
- **모든 수치는 더미 데이터에서 실시간 집계** (`lib/selectors.ts`). 반응형 그리드.

## 핵심 엔진 (lib)

- **reward** — 1차 교통비(5,000원) / 2차 ½ 일당 / 3차 일당 전액 / 4회차+ 보너스 없음.
  승급: Silver(5회·3.8↑) / Gold(10회·4.2↑) / Platinum(20회·4.5↑).
- **matcher** — 등급+30 / 관심사+25 / 거리+20 / 재수행 발주처+15 / 발주처평점4.5+ +10.
- **badgeIssuer** — 출석 80%↑ AND 점수 60↑ → 발급, 점수 구간으로 level 자동.

## 더미 데이터 (결정론적)

Users 200 · Instructors 8 · Employers 35 · Mentors 24 · Programs 12 · Courses 25 ·
Enrollments 600 · SpotJobs 580 · SpotHistory ≈1,350 · Companies 18 · JobPostings 24 ·
Mentorships 218 · Badges 410 · Portfolios 200 · ChatSessions 80 · Placements 41 · Notifications ≈1,570

대시보드 KPI(파생): 누적 양성인원 190 · 활성 119 · 취업률 50% · Spot 1,350 · 채용 35 · 만족도 4.25.

> ⚠️ 모든 데이터는 데모용 가상 데이터입니다. 실제 인물·기업·협약과 무관합니다.

## 기획서 충돌 지점에 대한 구현 결정

1. `successSequence` — 보상 단계 상승 구조에 맞춰 "개인 첫 1·2·3번째 성공" 순서형 모델.
2. `employed` vs Placement — **Placement 를 채용 단일 진실원본**으로, hired → `User.status='employed'` 동기화.
3. 참조만 있던 `Instructor`/`Employer`/`Mentor` 타입 추가로 FK 무결성 확보.

## 비고

- 프로덕션 번들이 큰 편입니다(faker 런타임 생성 + recharts). 실제 배포 시 빌드타임 데이터 산출,
  코드 스플리팅(`manualChunks`), 백엔드 AI 프록시를 권장합니다.
- 다크 모드는 Phase 2 범위로 제외했습니다.
