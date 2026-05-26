import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Star, Wallet } from "lucide-react";
import { useMe } from "@/hooks/useMe";
import { useData } from "@/contexts/DataContext";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/feedback";
import { userSpotHistory } from "@/lib/selectors";
import { BONUS_LABEL, formatCurrency, formatDate } from "@/lib/utils";

export default function SpotHistory() {
  const me = useMe();
  const { db } = useData();

  const history = useMemo(() => userSpotHistory(db, me.id), [db, me]);
  const jobById = useMemo(() => new Map(db.spotJobs.map((j) => [j.id, j])), [db]);

  const totalPaid = history.reduce((s, h) => s + h.totalPaid, 0);
  const bonusTotal = history.reduce((s, h) => s + h.bonusAmount, 0);
  const avgRating =
    history.length > 0
      ? history.reduce((s, h) => s + h.rating, 0) / history.length
      : 0;

  return (
    <div>
      <PageHeader
        title="Spot 이력 · 정산"
        subtitle={`누적 ${history.length}회 수행`}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat icon={<Sparkles className="h-4 w-4" />} label="수행 횟수" value={`${history.length}회`} />
        <Stat icon={<Wallet className="h-4 w-4" />} label="총 정산액" value={formatCurrency(totalPaid)} sub={`보너스 ${formatCurrency(bonusTotal)}`} />
        <Stat icon={<Star className="h-4 w-4" />} label="평균 평점" value={avgRating.toFixed(2)} />
      </div>

      <Card>
        <CardContent className="px-0">
          {history.length === 0 ? (
            <EmptyState
              title="Spot 이력이 없습니다"
              action={
                <Link to="/spot">
                  <Button variant="accent" size="sm">Spot 찾기</Button>
                </Link>
              }
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH className="pl-5">완료일</TH>
                  <TH>일감</TH>
                  <TH>기본 일당</TH>
                  <TH>보상 단계</TH>
                  <TH>정산액</TH>
                  <TH className="pr-5">평점</TH>
                </TR>
              </THead>
              <TBody>
                {history.map((h) => (
                  <TR key={h.id}>
                    <TD className="pl-5 text-slate-500">{formatDate(h.completedAt)}</TD>
                    <TD className="font-medium text-slate-800">
                      {jobById.get(h.jobId)?.title ?? "Spot"}
                    </TD>
                    <TD className="num">{formatCurrency(h.baseWage)}</TD>
                    <TD>
                      {h.bonusType ? (
                        <Badge variant="accent">{BONUS_LABEL[h.bonusType]}</Badge>
                      ) : (
                        <span className="text-xs text-slate-300">-</span>
                      )}
                    </TD>
                    <TD className="num font-semibold text-emerald-600">
                      {formatCurrency(h.totalPaid)}
                    </TD>
                    <TD className="num pr-5">★ {h.rating.toFixed(1)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <span className="flex items-center gap-1 text-xs text-slate-400">{icon} {label}</span>
        <p className="num mt-1 text-xl font-bold text-slate-900">{value}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </CardContent>
    </Card>
  );
}
