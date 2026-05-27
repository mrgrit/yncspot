import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  AREA_LABEL,
  LEVEL_LABEL,
  PROGRAM_TYPE_LABEL,
  TRACK_LABEL,
} from "@/lib/utils";

/** 교과목(프로그램) 상세 (제목 클릭 시) */
export function ProgramDetailDialog({
  programId,
  onClose,
}: {
  programId: string | null;
  onClose: () => void;
}) {
  const { db } = useData();
  const program = db.programs.find((p) => p.id === programId);
  if (!program) return null;

  const courses = db.courses.filter((c) => c.programId === program.id);
  const instructorById = new Map(db.instructors.map((i) => [i.id, i]));
  const enrolledCount = db.enrollments.filter((e) =>
    courses.some((c) => c.id === e.courseId)
  ).length;

  return (
    <Dialog open={!!programId} onClose={onClose} title={program.name} className="max-w-2xl">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={program.track === "try_job" ? "try" : "get"}>
            {TRACK_LABEL[program.track]}
          </Badge>
          <Badge variant="outline">{PROGRAM_TYPE_LABEL[program.type]}</Badge>
          <Badge variant="brand">{AREA_LABEL[program.area]}</Badge>
          <Badge variant="default">{LEVEL_LABEL[program.level]}</Badge>
          <Badge variant="outline">{program.hours}시간</Badge>
          <Badge variant="outline">정원 {program.capacity}</Badge>
        </div>

        <p className="text-sm leading-relaxed text-slate-600">{program.description}</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Section title="커리큘럼">
            <ol className="space-y-1.5">
              {program.syllabus.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-700">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-700">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </Section>

          <Section title="학습 성과">
            <ul className="space-y-1.5">
              {program.outcomes.map((o) => (
                <li key={o} className="flex gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {o}
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <Section title={`개설 분반 (${courses.length}) · 수강 ${enrolledCount}건`}>
          <div className="space-y-1">
            {courses.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="text-slate-700">{c.name}</span>
                <span className="text-xs text-slate-500">
                  {instructorById.get(c.instructorId)?.name ?? "강사"} · {c.schedule}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <p className="text-xs text-slate-400">
          교육 기간: {program.startDate} ~ {program.endDate}
        </p>
      </div>
    </Dialog>
  );
}

export function useProgramDetail() {
  const [programId, setProgramId] = useState<string | null>(null);
  return {
    programId,
    open: (id: string) => setProgramId(id),
    close: () => setProgramId(null),
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-slate-700">{title}</p>
      {children}
    </div>
  );
}
