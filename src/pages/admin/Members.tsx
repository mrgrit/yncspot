import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/feedback";
import { PersonDetailDialog } from "@/components/details/PersonDetail";
import { GRADE_LABEL, STATUS_LABEL, TRACK_LABEL, formatDate } from "@/lib/utils";
import type { SpotGrade, Track, User, UserStatus } from "@/types";

const PAGE = 15;

export default function Members() {
  const { db } = useData();
  const [q, setQ] = useState("");
  const [track, setTrack] = useState<Track | "all">("all");
  const [status, setStatus] = useState<UserStatus | "all">("all");
  const [grade, setGrade] = useState<SpotGrade | "all">("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<User | null>(null);

  const completedCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of db.enrollments)
      if (e.status === "completed") m.set(e.userId, (m.get(e.userId) ?? 0) + 1);
    return m;
  }, [db]);

  const filtered = useMemo(
    () =>
      db.users.filter(
        (u) =>
          (q === "" || u.name.includes(q) || u.email.includes(q)) &&
          (track === "all" || u.track === track) &&
          (status === "all" || u.status === status) &&
          (grade === "all" || u.spotGrade === grade)
      ),
    [db, q, track, status, grade]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const cur = Math.min(page, totalPages);
  const slice = filtered.slice((cur - 1) * PAGE, cur * PAGE);

  const exportCsv = () => {
    const header = ["id", "이름", "트랙", "상태", "등급", "Spot수행", "이수", "가입일"];
    const rows = filtered.map((u) => [
      u.id,
      u.name,
      TRACK_LABEL[u.track],
      STATUS_LABEL[u.status],
      GRADE_LABEL[u.spotGrade],
      u.spotCount,
      completedCount.get(u.id) ?? 0,
      formatDate(u.joinedAt),
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "members.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const reset = () => {
    setQ("");
    setTrack("all");
    setStatus("all");
    setGrade("all");
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="참여자 관리"
        subtitle={`총 ${filtered.length}명`}
        actions={
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4" /> CSV 내보내기
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="grid grid-cols-2 gap-2 p-4 lg:grid-cols-5">
          <div className="relative col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="이름·이메일 검색"
              className="pl-9"
            />
          </div>
          <Select value={track} onChange={(e) => { setTrack(e.target.value as Track | "all"); setPage(1); }}>
            <option value="all">전체 트랙</option>
            <option value="try_job">Try Job</option>
            <option value="get_job">Get Job</option>
          </Select>
          <Select value={status} onChange={(e) => { setStatus(e.target.value as UserStatus | "all"); setPage(1); }}>
            <option value="all">전체 상태</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Select value={grade} onChange={(e) => { setGrade(e.target.value as SpotGrade | "all"); setPage(1); }}>
            <option value="all">전체 등급</option>
            {Object.entries(GRADE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Button variant="ghost" size="sm" onClick={reset}>초기화</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-0">
          {slice.length === 0 ? (
            <EmptyState title="조건에 맞는 참여자가 없습니다" />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH className="pl-5">이름</TH>
                  <TH>트랙</TH>
                  <TH>상태</TH>
                  <TH>등급</TH>
                  <TH>Spot</TH>
                  <TH>이수</TH>
                  <TH className="pr-5">가입일</TH>
                </TR>
              </THead>
              <TBody>
                {slice.map((u) => (
                  <TR key={u.id} onClick={() => setSelected(u)}>
                    <TD className="pl-5">
                      <span className="flex items-center gap-2">
                        <Avatar name={u.name} color={u.avatarColor} size="sm" />
                        <span className="font-medium text-slate-800">{u.name}</span>
                      </span>
                    </TD>
                    <TD>
                      <Badge variant={u.track === "try_job" ? "try" : "get"}>
                        {TRACK_LABEL[u.track]}
                      </Badge>
                    </TD>
                    <TD className="text-slate-600">{STATUS_LABEL[u.status]}</TD>
                    <TD className="text-slate-600">{GRADE_LABEL[u.spotGrade]}</TD>
                    <TD className="num">{u.spotCount}</TD>
                    <TD className="num">{completedCount.get(u.id) ?? 0}</TD>
                    <TD className="pr-5 text-slate-500">{formatDate(u.joinedAt)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1.5">
          <Button variant="outline" size="sm" disabled={cur === 1} onClick={() => setPage(cur - 1)}>이전</Button>
          <span className="num px-3 text-sm text-slate-500">{cur} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={cur === totalPages} onClick={() => setPage(cur + 1)}>다음</Button>
        </div>
      )}

      <PersonDetailDialog userId={selected?.id ?? null} onClose={() => setSelected(null)} />
    </div>
  );
}
