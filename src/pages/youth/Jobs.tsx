import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Users } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { CONTRACT_TYPE_LABEL, formatDate } from "@/lib/utils";

export default function Jobs() {
  const { db } = useData();
  const [contract, setContract] = useState("all");

  const companyById = useMemo(
    () => new Map(db.companies.map((c) => [c.id, c])),
    [db]
  );
  const postings = useMemo(
    () =>
      db.jobPostings.filter((p) => contract === "all" || p.contractType === contract),
    [db, contract]
  );

  return (
    <div>
      <PageHeader
        title="협약기업 채용공고"
        subtitle={`${postings.length}개의 공고`}
        actions={
          <Select value={contract} onChange={(e) => setContract(e.target.value)}>
            <option value="all">전체 계약유형</option>
            <option value="employment_pact">채용약정</option>
            <option value="reserved_quota">계약정원제</option>
            <option value="general">일반채용</option>
          </Select>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {postings.map((p) => {
          const company = companyById.get(p.companyId);
          return (
            <Link key={p.id} to={`/jobs/${p.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col p-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="brand">{company?.name}</Badge>
                    <Badge
                      variant={
                        p.contractType === "employment_pact"
                          ? "success"
                          : p.contractType === "reserved_quota"
                            ? "accent"
                            : "outline"
                      }
                    >
                      {CONTRACT_TYPE_LABEL[p.contractType]}
                    </Badge>
                  </div>
                  <p className="mt-2 font-semibold text-slate-900">{p.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{p.description}</p>
                  <div className="mt-auto flex items-center gap-3 pt-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <CalendarClock className="h-3 w-3" /> ~{formatDate(p.deadline)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> 지원 {p.applicantCount}명
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
