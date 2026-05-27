import { useMemo, useState } from "react";
import { Award, GraduationCap, Search, Sparkles, TrendingUp } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/feedback";
import { PersonDetailDialog, usePersonDetail } from "@/components/details/PersonDetail";
import { graduateOutcomes, graduateRows } from "@/lib/selectors";
import { GRADE_LABEL, TRACK_LABEL } from "@/lib/utils";
import type { Track } from "@/types";

export default function Graduates() {
  const { db } = useData();
  const outcomes = useMemo(() => graduateOutcomes(db), [db]);
  const rows = useMemo(() => graduateRows(db), [db]);

  const [q, setQ] = useState("");
  const [track, setTrack] = useState<Track | "all">("all");
  const [emp, setEmp] = useState<"all" | "employed" | "seeking">("all");
  const person = usePersonDetail();

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (q === "" || r.user.name.includes(q) || (r.capstone ?? "").includes(q)) &&
          (track === "all" || r.user.track === track) &&
          (emp === "all" || (emp === "employed" ? r.employed : !r.employed))
      ),
    [rows, q, track, emp]
  );

  return (
    <div>
      <PageHeader
        title="수료생 사후관리"
        subtitle="사업 실적 · 수료생 취업 현황 · 캡스톤 산출물"
      />

      {/* 실적 KPI */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<GraduationCap className="h-4 w-4" />} label="수료생" value={`${outcomes.total}명`} />
        <Stat icon={<TrendingUp className="h-4 w-4" />} label="취업" value={`${outcomes.employed}명`} sub={`취업률 ${outcomes.employRate}%`} />
        <Stat icon={<Sparkles className="h-4 w-4" />} label="캡스톤 완료" value={`${outcomes.capstoneDone}명`} />
        <Stat
          icon={<Award className="h-4 w-4" />}
          label="트랙별 취업률"
          value={`T ${outcomes.byTrack.try_job.rate}% / G ${outcomes.byTrack.get_job.rate}%`}
        />
      </div>

      {/* 필터 */}
      <Card className="mb-4">
        <CardContent className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름·캡스톤 검색" className="pl-9" />
          </div>
          <Select value={track} onChange={(e) => setTrack(e.target.value as Track | "all")}>
            <option value="all">전체 트랙</option>
            <option value="try_job">Try Job</option>
            <option value="get_job">Get Job</option>
          </Select>
          <Select value={emp} onChange={(e) => setEmp(e.target.value as "all" | "employed" | "seeking")}>
            <option value="all">전체</option>
            <option value="employed">취업</option>
            <option value="seeking">구직중</option>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>수료생 명단 ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {filtered.length === 0 ? (
            <EmptyState title="조건에 맞는 수료생이 없습니다" />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH className="pl-5">이름</TH>
                  <TH>트랙</TH>
                  <TH>등급</TH>
                  <TH>이수</TH>
                  <TH>교육시간</TH>
                  <TH>캡스톤</TH>
                  <TH>배지</TH>
                  <TH className="pr-5">취업처</TH>
                </TR>
              </THead>
              <TBody>
                {filtered.map((r) => (
                  <TR key={r.user.id} onClick={() => person.open(r.user.id)}>
                    <TD className="pl-5">
                      <span className="flex items-center gap-2">
                        <Avatar name={r.user.name} color={r.user.avatarColor} size="sm" />
                        <span className="font-medium text-slate-800">{r.user.name}</span>
                      </span>
                    </TD>
                    <TD>
                      <Badge variant={r.user.track === "try_job" ? "try" : "get"}>
                        {TRACK_LABEL[r.user.track]}
                      </Badge>
                    </TD>
                    <TD className="text-slate-600">{GRADE_LABEL[r.user.spotGrade]}</TD>
                    <TD className="num">{r.completedCount}과목</TD>
                    <TD className="num">{r.hours}h</TD>
                    <TD className="max-w-44 truncate text-slate-500">{r.capstone ?? "-"}</TD>
                    <TD className="num">{r.badges}</TD>
                    <TD className="pr-5">
                      {r.employed ? (
                        <Badge variant="success">{r.companyName ?? "취업"}</Badge>
                      ) : (
                        <span className="text-xs text-slate-400">구직중</span>
                      )}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PersonDetailDialog userId={person.userId} onClose={person.close} />
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
        <p className="num mt-1 text-lg font-bold text-slate-900">{value}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </CardContent>
    </Card>
  );
}
