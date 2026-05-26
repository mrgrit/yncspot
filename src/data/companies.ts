/**
 * 협약기업 18개 — 사업방향에 명시된 기업을 우선 포함한 큐레이션 시드.
 * ⚠️ 데모용 가상 협약 예시이며 실제 협약 관계를 의미하지 않습니다.
 */
import type { Company } from "@/types";
import { idFactory, int, pick } from "./pools";

interface CompanySeed {
  name: string;
  industry: string;
  size: Company["size"];
  address: string;
  matchedDepartments: string[];
}

const COMPANY_SEEDS: CompanySeed[] = [
  { name: "쿠팡 CFS", industry: "물류", size: "대기업", address: "대구광역시 달성군 구지면", matchedDepartments: ["i-경영회계", "물류관리"] },
  { name: "현대그린푸드", industry: "식음료", size: "대기업", address: "대구광역시 수성구", matchedDepartments: ["식음료/베이커리"] },
  { name: "풀무원", industry: "식음료", size: "대기업", address: "서울특별시 강남구", matchedDepartments: ["식음료/베이커리"] },
  { name: "숨고", industry: "프리랜서 플랫폼", size: "중견기업", address: "서울특별시 강남구", matchedDepartments: ["디자인"] },
  { name: "크몽", industry: "프리랜서 플랫폼", size: "중견기업", address: "서울특별시 서초구", matchedDepartments: ["디자인", "콘텐츠제작"] },
  { name: "DGB금융그룹", industry: "금융", size: "대기업", address: "대구광역시 수성구", matchedDepartments: ["i-경영회계"] },
  { name: "iM뱅크(대구은행)", industry: "금융", size: "대기업", address: "대구광역시 북구", matchedDepartments: ["i-경영회계", "고객서비스"] },
  { name: "에스엘(SL)", industry: "자동차부품 제조", size: "대기업", address: "대구광역시 달서구", matchedDepartments: ["생산관리"] },
  { name: "평화정공", industry: "자동차부품", size: "중견기업", address: "대구광역시 달성군", matchedDepartments: ["생산관리"] },
  { name: "이마트 만촌점", industry: "유통", size: "대기업", address: "대구광역시 수성구", matchedDepartments: ["유통/판매", "고객서비스"] },
  { name: "신세계백화점 대구점", industry: "유통", size: "대기업", address: "대구광역시 동구 신천동", matchedDepartments: ["유통/판매"] },
  { name: "대구교통공사", industry: "공공·운수", size: "공공기관", address: "대구광역시 남구", matchedDepartments: ["고객서비스"] },
  { name: "동원F&B", industry: "식음료", size: "대기업", address: "서울특별시 서초구", matchedDepartments: ["식음료/베이커리"] },
  { name: "한국가스공사", industry: "공공·에너지", size: "공공기관", address: "대구광역시 동구 혁신도시", matchedDepartments: ["i-경영회계"] },
  { name: "카카오모빌리티", industry: "IT 플랫폼", size: "중견기업", address: "경기도 성남시 분당구", matchedDepartments: ["콘텐츠제작", "데이터"] },
  { name: "한국전력공사 대구본부", industry: "공공·에너지", size: "공공기관", address: "대구광역시 중구", matchedDepartments: ["i-경영회계"] },
  { name: "롯데마트 율하점", industry: "유통", size: "대기업", address: "대구광역시 동구", matchedDepartments: ["유통/판매", "고객서비스"] },
  { name: "대구디지털혁신진흥원", industry: "공공·IT", size: "공공기관", address: "대구광역시 동구", matchedDepartments: ["AI", "콘텐츠제작"] },
];

const CONTACT_SURNAMES = ["김", "이", "박", "최", "정", "강", "윤", "장"];
const CONTACT_GIVEN = ["수민", "지훈", "현아", "도경", "선영", "태웅", "예린", "상현"];

export function buildCompanies(): Company[] {
  const nextId = idFactory("cmp");
  return COMPANY_SEEDS.map((seed) => {
    const id = nextId();
    const person = `${pick(CONTACT_SURNAMES)}${pick(CONTACT_GIVEN)}`;
    const domain = `corp${id.slice(-3)}.example.com`;
    return {
      id,
      name: seed.name,
      industry: seed.industry,
      size: seed.size,
      address: seed.address,
      matchedDepartments: seed.matchedDepartments,
      hiringQuota: int(2, 12),
      contactPerson: `${person} 담당자`,
      contactEmail: `recruit@${domain}`,
    };
  });
}
