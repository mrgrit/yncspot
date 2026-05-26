import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/feedback";
import { userEnrollments, userSpotHistory } from "@/lib/selectors";
import {
  GRADE_LABEL,
  STATUS_LABEL,
  TRACK_LABEL,
  formatCurrency,
  formatDate,
} from "@/lib/utils";
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

      <MemberDialog user={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function MemberDialog({ user, onClose }: { user: User | null; onClose: () => void }) {
  const { db } = useData();
  if (!user) return null;

  const enr = userEnrollments(db, user.id);
  const spots = userSpotHistory(db, user.id).slice(0, 5);
  const chats = db.chatSessions.filter((c) => c.userId === user.id);
  const programById = new Map(db.programs.map((p) => [p.id, p]));
  const courseProgram = new Map(db.courses.map((c) => [c.id, c.programId]));
  const jobById = new Map(db.spotJobs.map((j) => [j.id, j]));

  return (
    <Dialog open={!!user} onClose={onClose} title={user.name} className="max-w-2xl">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={user.track === "try_job" ? "try" : "get"}>{TRACK_LABEL[user.track]}</Badge>
          <Badge variant="default">{STATUS_LABEL[user.status]}</Badge>
          <Badge variant="accent">{GRADE_LABEL[user.spotGrade]}</Badge>
          {user.nais_registered && <Badge variant="success">통합플랫폼 등재</Badge>}
          {user.gov24_assessed && <Badge variant="brand">구직준비도 {user.gov24_score}점</Badge>}
        </div>
        <p className="text-sm text-slate-500">
          {user.email} · {user.phone} · {user.address}
        </p>

        <Section title={`학습 이력 (${enr.length})`}>
          {enr.length === 0 ? (
            <Empty />
          ) : (
            enr.slice(0, 6).map((e) => (
              <Row
                key={e.id}
                left={programById.get(courseProgram.get(e.courseId)!)?.name ?? "과정"}
                right={`${STATUS_LABEL[e.status as keyof typeof STATUS_LABEL] ?? e.status} · 출석 ${e.attendanceRate}%`}
              />
            ))
          )}
        </Section>

        <Section title={`Spot 이력 (${user.spotCount})`}>
          {spots.length === 0 ? (
            <Empty />
          ) : (
            spots.map((h) => (
              <Row
                key={h.id}
                left={jobById.get(h.jobId)?.title ?? "Spot"}
                right={`${formatCurrency(h.totalPaid)} · ★${h.rating.toFixed(1)}`}
              />
            ))
          )}
        </Section>

        <Section title={`AI 상담 이력 (${chats.length})`}>
          {chats.length === 0 ? (
            <Empty />
          ) : (
            chats.slice(0, 4).map((c) => (
              <Row key={c.id} left={c.title} right={`${c.messages.length}개 메시지`} />
            ))
          )}
        </Section>
      </div>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-slate-700">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
function Row({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
      <span className="min-w-0 truncate text-slate-700">{left}</span>
      <span className="shrink-0 text-xs text-slate-500">{right}</span>
    </div>
  );
}
function Empty() {
  return <p className="px-1 text-xs text-slate-400">이력이 없습니다</p>;
}
