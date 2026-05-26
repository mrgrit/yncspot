import { useMemo, useState } from "react";
import { CheckCircle2, CircleDot, Clock, Wallet } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import {
  GRADE_LABEL,
  SPOTJOB_STATUS_LABEL,
  formatCurrency,
  formatDate,
} from "@/lib/utils";
import type { SpotJobStatus } from "@/types";

const PAGE = 20;

export default function AdminSpotJobs() {
  const { db } = useData();
  const [status, setStatus] = useState<SpotJobStatus | "all">("all");
  const [page, setPage] = useState(1);

  const employerById = useMemo(
    () => new Map(db.employers.map((e) => [e.id, e])),
    [db]
  );

  const counts = useMemo(() => {
    const c = { open: 0, matched: 0, in_progress: 0, completed: 0 } as Record<SpotJobStatus, number>;
    for (const j of db.spotJobs) c[j.status]++;
    return c;
  }, [db]);

  const totalPaid = useMemo(
    () => db.spotHistory.reduce((s, h) => s + h.totalPaid, 0),
    [db]
  );

  const filtered = useMemo(
    () => db.spotJobs.filter((j) => status === "all" || j.status === status),
    [db, status]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const cur = Math.min(page, totalPages);
  const slice = filtered.slice((cur - 1) * PAGE, cur * PAGE);

  return (
    <div>
      <PageHeader
        title="Spot Work 운영"
        subtitle={`일감 ${db.spotJobs.length}건 · 수행 이력 ${db.spotHistory.length}건`}
        actions={
          <Select value={status} onChange={(e) => { setStatus(e.target.value as SpotJobStatus | "all"); setPage(1); }}>
            <option value="all">전체 상태</option>
            {Object.entries(SPOTJOB_STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<CircleDot className="h-4 w-4" />} label="모집중" value={`${counts.open}건`} />
        <Stat icon={<Clock className="h-4 w-4" />} label="진행중" value={`${counts.in_progress}건`} />
        <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="완료" value={`${counts.completed}건`} />
        <Stat icon={<Wallet className="h-4 w-4" />} label="누적 정산" value={formatCurrency(totalPaid)} />
      </div>

      <Card>
        <CardContent className="px-0">
          <Table>
            <THead>
              <TR>
                <TH className="pl-5">일감</TH>
                <TH>발주처</TH>
                <TH>카테고리</TH>
                <TH>일당</TH>
                <TH>요구등급</TH>
                <TH>상태</TH>
                <TH className="pr-5">예정일</TH>
              </TR>
            </THead>
            <TBody>
              {slice.map((j) => (
                <TR key={j.id}>
                  <TD className="pl-5 font-medium text-slate-800">{j.title}</TD>
                  <TD className="text-slate-600">{employerById.get(j.employerId)?.name}</TD>
                  <TD>
                    <Badge variant="outline">{j.category}</Badge>
                  </TD>
                  <TD className="num">{formatCurrency(j.baseWage)}</TD>
                  <TD className="text-slate-600">{GRADE_LABEL[j.requiredGrade]}</TD>
                  <TD>
                    <Badge
                      variant={
                        j.status === "completed"
                          ? "success"
                          : j.status === "open"
                            ? "brand"
                            : "accent"
                      }
                    >
                      {SPOTJOB_STATUS_LABEL[j.status]}
                    </Badge>
                  </TD>
                  <TD className="pr-5 text-slate-500">{formatDate(j.scheduledAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1.5 text-sm text-slate-500">
          <button className="rounded-lg px-3 py-1 hover:bg-slate-100 disabled:opacity-40" disabled={cur === 1} onClick={() => setPage(cur - 1)}>이전</button>
          <span className="num">{cur} / {totalPages}</span>
          <button className="rounded-lg px-3 py-1 hover:bg-slate-100 disabled:opacity-40" disabled={cur === totalPages} onClick={() => setPage(cur + 1)}>다음</button>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <span className="flex items-center gap-1 text-xs text-slate-400">{icon} {label}</span>
        <p className="num mt-1 text-lg font-bold text-slate-900">{value}</p>
      </CardContent>
    </Card>
  );
}
