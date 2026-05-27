import { useMemo, useState } from "react";
import { Award, Briefcase, Building2, GraduationCap, Search, Sparkles, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/feedback";
import { PersonDetailDialog, usePersonDetail } from "@/components/details/PersonDetail";
import { companyStats, graduateRows } from "@/lib/selectors";
import { CONTRACT_TYPE_LABEL, GRADE_LABEL, TRACK_LABEL, formatDate } from "@/lib/utils";
import type { SpotGrade, Track } from "@/types";

export default function CompanyPortal() {
  const { account } = useAuth();
  const { db } = useData();
  const company = db.companies.find((c) => c.id === account?.companyId) ?? db.companies[0];

  const [q, setQ] = useState("");
  const [track, setTrack] = useState<Track | "all">("all");
  const [grade, setGrade] = useState<SpotGrade | "all">("all");
  const person = usePersonDetail();

  const stats = useMemo(() => companyStats(db, company.id), [db, company]);
  const postings = useMemo(
    () => db.jobPostings.filter((p) => p.companyId === company.id),
    [db, company]
  );

  const allGrads = useMemo(() => graduateRows(db), [db]);
  const talent = useMemo(
    () =>
      allGrads
        .filter(
          (r) =>
            (q === "" ||
              r.user.name.includes(q) ||
              r.user.interests.some((i) => i.includes(q)) ||
              (r.capstone ?? "").includes(q)) &&
            (track === "all" || r.user.track === track) &&
            (grade === "all" || r.user.spotGrade === grade)
        )
        .sort((a, b) => b.badges - a.badges || b.completedCount - a.completedCount),
    [allGrads, q, track, grade]
  );

  return (
    <div>
      <PageHeader
        title={company.name}
        subtitle={`${company.industry} · ${company.size} · 협약기업 포털`}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Briefcase className="h-4 w-4" />} label="채용 공고" value={stats.postings} />
        <Stat icon={<Users className="h-4 w-4" />} label="지원자" value={stats.applicants} />
        <Stat icon={<GraduationCap className="h-4 w-4" />} label="수료 인재풀" value={allGrads.length} />
        <Stat icon={<Award className="h-4 w-4" />} label="채용 확정" value={stats.hired} highlight />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* 인재 풀 검색 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>인재 풀 검색 (수료생 {talent.length}명)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-4">
              <div className="relative sm:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="이름·관심사·캡스톤 검색"
                  className="pl-9"
                />
              </div>
              <Select value={track} onChange={(e) => setTrack(e.target.value as Track | "all")}>
                <option value="all">전체 트랙</option>
                <option value="try_job">Try Job</option>
                <option value="get_job">Get Job</option>
              </Select>
              <Select value={grade} onChange={(e) => setGrade(e.target.value as SpotGrade | "all")}>
                <option value="all">전체 등급</option>
                {Object.entries(GRADE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </div>

            {talent.length === 0 ? (
              <EmptyState title="조건에 맞는 수료생이 없습니다" />
            ) : (
              <div className="grid max-h-[28rem] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {talent.slice(0, 30).map((r) => (
                  <div
                    key={r.user.id}
                    onClick={() => person.open(r.user.id)}
                    className="cursor-pointer rounded-2xl border border-slate-100 p-3 transition-colors hover:border-brand-200 hover:bg-brand-50/30"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar name={r.user.name} color={r.user.avatarColor} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-slate-800">{r.user.name}</p>
                          {r.employed && <Badge variant="success">취업</Badge>}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1">
                          <Badge variant={r.user.track === "try_job" ? "try" : "get"}>
                            {TRACK_LABEL[r.user.track]}
                          </Badge>
                          <span className="text-xs text-slate-400">{GRADE_LABEL[r.user.spotGrade]}</span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      이수 {r.completedCount}과목 · {r.hours}h · 배지 {r.badges}개
                    </p>
                    {r.capstone && (
                      <p className="mt-1 flex items-start gap-1 text-xs text-brand-700">
                        <Sparkles className="mt-0.5 h-3 w-3 shrink-0" /> 캡스톤: {r.capstone}
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {r.user.interests.slice(0, 3).map((i) => (
                        <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                          {i}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 우리 회사 공고 */}
        <Card>
          <CardHeader>
            <CardTitle>우리 회사 공고</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {postings.length === 0 ? (
              <EmptyState title="등록된 공고가 없습니다" icon={<Sparkles className="h-6 w-6" />} />
            ) : (
              postings.map((p) => (
                <div key={p.id} className="rounded-2xl border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-800">{p.title}</p>
                    <Badge variant="outline">{CONTRACT_TYPE_LABEL[p.contractType]}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    지원 {p.applicantCount}명 · 마감 {formatDate(p.deadline)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <PersonDetailDialog userId={person.userId} onClose={person.close} />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <span className="flex items-center gap-1 text-xs text-slate-400">{icon} {label}</span>
        <p className={`num mt-1 text-2xl font-bold ${highlight ? "text-emerald-600" : "text-slate-900"}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
