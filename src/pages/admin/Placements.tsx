import { useMemo, useState } from "react";
import { useData } from "@/contexts/DataContext";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/feedback";
import { PersonDetailDialog, usePersonDetail } from "@/components/details/PersonDetail";
import { PLACEMENT_STATUS_LABEL, formatDate } from "@/lib/utils";
import type { PlacementStatus } from "@/types";

const FUNNEL: { key: PlacementStatus; label: string; color: string }[] = [
  { key: "applied", label: "지원", color: "#64748B" },
  { key: "interviewing", label: "면접중", color: "#F59E0B" },
  { key: "hired", label: "채용확정", color: "#10B981" },
  { key: "rejected", label: "불합격", color: "#EF4444" },
];

export default function Placements() {
  const { db } = useData();
  const [status, setStatus] = useState<PlacementStatus | "all">("all");
  const person = usePersonDetail();

  const userById = useMemo(() => new Map(db.users.map((u) => [u.id, u])), [db]);
  const companyById = useMemo(() => new Map(db.companies.map((c) => [c.id, c])), [db]);
  const postingById = useMemo(() => new Map(db.jobPostings.map((p) => [p.id, p])), [db]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of db.placements) c[p.status] = (c[p.status] ?? 0) + 1;
    return c;
  }, [db]);

  const filtered = useMemo(
    () =>
      db.placements
        .filter((p) => status === "all" || p.status === status)
        .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()),
    [db, status]
  );

  return (
    <div>
      <PageHeader
        title="취업 매칭"
        subtitle="지원 → 면접 → 채용 연계 트래킹"
        actions={
          <Select value={status} onChange={(e) => setStatus(e.target.value as PlacementStatus | "all")}>
            <option value="all">전체 상태</option>
            {FUNNEL.map((f) => (
              <option key={f.key} value={f.key}>{f.label}</option>
            ))}
          </Select>
        }
      />

      {/* 펀널 */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {FUNNEL.map((f) => (
          <Card key={f.key}>
            <CardContent className="p-4">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                {f.label}
              </span>
              <p className="num mt-1 text-2xl font-bold text-slate-900">{counts[f.key] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="px-0">
          {filtered.length === 0 ? (
            <EmptyState title="해당 상태의 연계 내역이 없습니다" />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH className="pl-5">참여자</TH>
                  <TH>기업</TH>
                  <TH>공고</TH>
                  <TH>지원</TH>
                  <TH>면접</TH>
                  <TH>채용</TH>
                  <TH className="pr-5">상태</TH>
                </TR>
              </THead>
              <TBody>
                {filtered.map((p) => {
                  const u = userById.get(p.userId);
                  return (
                    <TR key={p.id} onClick={() => person.open(p.userId)}>
                      <TD className="pl-5">
                        <span className="flex items-center gap-2">
                          <Avatar name={u?.name ?? "?"} color={u?.avatarColor} size="sm" />
                          <span className="font-medium text-slate-800">{u?.name}</span>
                        </span>
                      </TD>
                      <TD className="text-slate-600">{companyById.get(p.companyId)?.name}</TD>
                      <TD className="max-w-40 truncate text-slate-500">
                        {postingById.get(p.jobPostingId)?.title ?? "-"}
                      </TD>
                      <TD className="text-slate-500">{formatDate(p.appliedAt)}</TD>
                      <TD className="text-slate-500">{formatDate(p.interviewAt)}</TD>
                      <TD className="text-slate-500">{formatDate(p.hiredAt)}</TD>
                      <TD className="pr-5">
                        <Badge
                          variant={
                            p.status === "hired"
                              ? "success"
                              : p.status === "interviewing"
                                ? "accent"
                                : p.status === "rejected"
                                  ? "warning"
                                  : "default"
                          }
                        >
                          {PLACEMENT_STATUS_LABEL[p.status]}
                        </Badge>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PersonDetailDialog userId={person.userId} onClose={person.close} />
    </div>
  );
}
