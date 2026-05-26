import { useMemo } from "react";
import { Award, Briefcase, Building2, Sparkles, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/feedback";
import { companyStats, learningSummary, userBadges } from "@/lib/selectors";
import {
  CONTRACT_TYPE_LABEL,
  GRADE_LABEL,
  TRACK_LABEL,
  formatDate,
} from "@/lib/utils";

export default function CompanyPortal() {
  const { account } = useAuth();
  const { db } = useData();
  const company = db.companies.find((c) => c.id === account?.companyId) ?? db.companies[0];

  const stats = useMemo(() => companyStats(db, company.id), [db, company]);
  const postings = useMemo(
    () => db.jobPostings.filter((p) => p.companyId === company.id),
    [db, company]
  );

  const talent = useMemo(() => {
    return db.users
      .filter((u) => u.status === "completed" || u.status === "employed")
      .map((u) => ({
        u,
        badges: userBadges(db, u.id).length,
        learn: learningSummary(db, u.id),
      }))
      .sort((a, b) => b.badges - a.badges || b.learn.completedCount - a.learn.completedCount)
      .slice(0, 12);
  }, [db]);

  return (
    <div>
      <PageHeader
        title={company.name}
        subtitle={`${company.industry} · ${company.size} · 협약기업 포털`}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Briefcase className="h-4 w-4" />} label="채용 공고" value={stats.postings} />
        <Stat icon={<Users className="h-4 w-4" />} label="지원자" value={stats.applicants} />
        <Stat icon={<Building2 className="h-4 w-4" />} label="매칭" value={stats.matched} />
        <Stat icon={<Award className="h-4 w-4" />} label="채용 확정" value={stats.hired} highlight />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* 인재 풀 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>인재 풀 (이수자)</CardTitle>
          </CardHeader>
          <CardContent>
            {talent.length === 0 ? (
              <EmptyState title="이수자가 없습니다" />
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {talent.map(({ u, badges, learn }) => (
                  <div key={u.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
                    <Avatar name={u.name} color={u.avatarColor} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{u.name}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1">
                        <Badge variant={u.track === "try_job" ? "try" : "get"}>
                          {TRACK_LABEL[u.track]}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          {GRADE_LABEL[u.spotGrade]}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">
                        이수 {learn.completedCount}과목 · 배지 {badges}개 · {u.interests.slice(0, 2).join("·")}
                      </p>
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
