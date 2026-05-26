import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Building2, CalendarClock, Check, CheckCircle2, Gift } from "lucide-react";
import { useMe } from "@/hooks/useMe";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { jobMatchScore } from "@/lib/selectors";
import { CONTRACT_TYPE_LABEL, formatDate } from "@/lib/utils";

export default function JobDetail() {
  const { id } = useParams();
  const me = useMe();
  const { db, applyJob, appliedJobs } = useData();
  const { toast } = useToast();

  const posting = db.jobPostings.find((p) => p.id === id);
  const company = posting ? db.companies.find((c) => c.id === posting.companyId) : undefined;
  const score = useMemo(
    () => (posting && company ? jobMatchScore(me, company, posting) : 0),
    [me, company, posting]
  );

  if (!posting || !company) {
    return (
      <EmptyState
        title="채용공고를 찾을 수 없습니다"
        action={
          <Link to="/jobs">
            <Button>목록으로</Button>
          </Link>
        }
      />
    );
  }

  const applied = appliedJobs.has(posting.id);
  const submit = () => {
    applyJob(posting.id);
    toast("지원이 완료되었습니다");
  };

  return (
    <div className="space-y-4">
      <Link to="/jobs" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> 채용공고 목록
      </Link>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand">{company.name}</Badge>
            <Badge
              variant={
                posting.contractType === "employment_pact"
                  ? "success"
                  : posting.contractType === "reserved_quota"
                    ? "accent"
                    : "outline"
              }
            >
              {CONTRACT_TYPE_LABEL[posting.contractType]}
            </Badge>
          </div>
          <h1 className="mt-2 text-xl font-bold text-slate-900">{posting.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{posting.description}</p>

          <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <CalendarClock className="h-4 w-4" /> 마감 {formatDate(posting.deadline)}
            </span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              매칭 점수 {score}점
            </span>
          </div>

          <div className="mt-5">
            <Button variant="accent" disabled={applied} onClick={submit}>
              {applied ? (
                <>
                  <Check className="h-4 w-4" /> 지원완료
                </>
              ) : (
                "지원하기"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>지원 자격</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {posting.requirements.map((r) => (
                <li key={r} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-brand-700" /> {r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>복리후생 & 기업정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {posting.benefits.map((b) => (
                <Badge key={b} variant="outline">
                  <Gift className="h-3 w-3" /> {b}
                </Badge>
              ))}
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 text-sm">
              <p className="flex items-center gap-1.5 font-medium text-slate-800">
                <Building2 className="h-4 w-4 text-slate-400" /> {company.name}
              </p>
              <p className="mt-1 text-slate-500">
                {company.industry} · {company.size} · {company.address}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                매칭 학과: {company.matchedDepartments.join(", ")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
