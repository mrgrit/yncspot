import { useMemo } from "react";
import { BookOpen, GraduationCap, Layers, Percent } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { programCompletionRates } from "@/lib/selectors";
import {
  AREA_LABEL,
  LEVEL_LABEL,
  PROGRAM_TYPE_LABEL,
  TRACK_LABEL,
} from "@/lib/utils";

export default function AdminCourses() {
  const { db } = useData();
  const rates = useMemo(() => programCompletionRates(db), [db]);
  const rateById = useMemo(() => new Map(rates.map((r) => [r.id, r])), [rates]);

  const totalEnr = db.enrollments.length;
  const completed = db.enrollments.filter((e) => e.status === "completed").length;
  const avgRate = totalEnr ? Math.round((completed / totalEnr) * 100) : 0;

  return (
    <div>
      <PageHeader title="교육 운영" subtitle="프로그램·교과목·이수 현황" />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Layers className="h-4 w-4" />} label="프로그램" value={`${db.programs.length}개`} />
        <Stat icon={<BookOpen className="h-4 w-4" />} label="교과목" value={`${db.courses.length}개`} />
        <Stat icon={<GraduationCap className="h-4 w-4" />} label="총 수강" value={`${totalEnr}건`} />
        <Stat icon={<Percent className="h-4 w-4" />} label="평균 이수율" value={`${avgRate}%`} />
      </div>

      <Card>
        <CardContent className="px-0">
          <Table>
            <THead>
              <TR>
                <TH className="pl-5">프로그램</TH>
                <TH>트랙</TH>
                <TH>구분</TH>
                <TH>영역/수준</TH>
                <TH>시간</TH>
                <TH>수강</TH>
                <TH className="pr-5">이수율</TH>
              </TR>
            </THead>
            <TBody>
              {db.programs.map((p) => {
                const r = rateById.get(p.id);
                return (
                  <TR key={p.id}>
                    <TD className="pl-5 font-medium text-slate-800">{p.name}</TD>
                    <TD>
                      <Badge variant={p.track === "try_job" ? "try" : "get"}>
                        {TRACK_LABEL[p.track]}
                      </Badge>
                    </TD>
                    <TD className="text-slate-600">{PROGRAM_TYPE_LABEL[p.type]}</TD>
                    <TD className="text-slate-500">
                      {AREA_LABEL[p.area]} · {LEVEL_LABEL[p.level]}
                    </TD>
                    <TD className="num">{p.hours}h</TD>
                    <TD className="num">{r?.total ?? 0}건</TD>
                    <TD className="w-40 pr-5">
                      <ProgressBar value={r?.rate ?? 0} showLabel />
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <span className="flex items-center gap-1 text-xs text-slate-400">{icon} {label}</span>
        <p className="num mt-1 text-xl font-bold text-slate-900">{value}</p>
      </CardContent>
    </Card>
  );
}
