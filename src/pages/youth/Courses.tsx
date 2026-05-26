import { useMemo, useState } from "react";
import { BookOpen, Clock, Users } from "lucide-react";
import { useMe } from "@/hooks/useMe";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ProgressBar } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/feedback";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { userEnrollments } from "@/lib/selectors";
import {
  AREA_LABEL,
  ENROLLMENT_STATUS_LABEL,
  LEVEL_LABEL,
  PROGRAM_TYPE_LABEL,
  TRACK_LABEL,
} from "@/lib/utils";
import type { Program, Track } from "@/types";

export default function Courses() {
  const me = useMe();
  const { db, enrollCourse, enrolledCourses } = useData();
  const { toast } = useToast();

  const [trackFilter, setTrackFilter] = useState<Track | "all">(me.track);
  const [modalProgram, setModalProgram] = useState<Program | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>("");

  const programs = useMemo(
    () => db.programs.filter((p) => trackFilter === "all" || p.track === trackFilter),
    [db, trackFilter]
  );
  const coursesByProgram = useMemo(() => {
    const m = new Map<string, typeof db.courses>();
    for (const c of db.courses) {
      const arr = m.get(c.programId) ?? [];
      arr.push(c);
      m.set(c.programId, arr);
    }
    return m;
  }, [db]);

  const myEnrollments = useMemo(() => userEnrollments(db, me.id), [db, me]);
  const courseById = useMemo(() => new Map(db.courses.map((c) => [c.id, c])), [db]);
  const programById = useMemo(() => new Map(db.programs.map((p) => [p.id, p])), [db]);

  const openModal = (p: Program) => {
    const courses = coursesByProgram.get(p.id) ?? [];
    setModalProgram(p);
    setSelectedCourse(courses[0]?.id ?? "");
  };

  const submit = () => {
    if (!selectedCourse) return;
    enrollCourse(me.id, selectedCourse);
    setModalProgram(null);
    toast("수강신청이 완료되었습니다");
  };

  return (
    <div>
      <PageHeader title="교육과정" subtitle="교양·사회 + AI공통 + 실전·전문 동시이수" />

      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog">과정 둘러보기</TabsTrigger>
          <TabsTrigger value="my">내 수강 현황</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog">
          <div className="mb-3 flex gap-1.5">
            {([
              { v: "all", label: "전체" },
              { v: "try_job", label: "Try Job" },
              { v: "get_job", label: "Get Job" },
            ] as const).map((t) => (
              <Button
                key={t.v}
                size="sm"
                variant={trackFilter === t.v ? "primary" : "outline"}
                onClick={() => setTrackFilter(t.v)}
              >
                {t.label}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((p) => {
              const courses = coursesByProgram.get(p.id) ?? [];
              return (
                <Card key={p.id} className="flex flex-col">
                  <CardContent className="flex flex-1 flex-col p-4">
                    <div className="flex items-center justify-between">
                      <Badge variant={p.track === "try_job" ? "try" : "get"}>
                        {TRACK_LABEL[p.track]}
                      </Badge>
                      <Badge variant="outline">{PROGRAM_TYPE_LABEL[p.type]}</Badge>
                    </div>
                    <p className="mt-2 font-semibold text-slate-900">{p.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {LEVEL_LABEL[p.level]} · {AREA_LABEL[p.area]}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {p.hours}시간
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> 정원 {p.capacity}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" /> 분반 {courses.length}
                      </span>
                    </div>
                    <div className="mt-auto pt-3">
                      <Button size="sm" className="w-full" onClick={() => openModal(p)}>
                        수강신청
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="my">
          <Card>
            <CardContent className="px-0">
              {myEnrollments.length === 0 ? (
                <EmptyState title="수강 내역이 없습니다" description="관심 과정을 신청해 보세요" />
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH className="pl-5">과정</TH>
                      <TH>분반</TH>
                      <TH>상태</TH>
                      <TH>출석률</TH>
                      <TH className="pr-5">점수</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {myEnrollments.map((e) => {
                      const course = courseById.get(e.courseId);
                      const program = course ? programById.get(course.programId) : undefined;
                      return (
                        <TR key={e.id}>
                          <TD className="pl-5 font-medium text-slate-800">
                            {program?.name ?? "과정"}
                          </TD>
                          <TD className="text-slate-500">{course?.name ?? "-"}</TD>
                          <TD>
                            <Badge
                              variant={
                                e.status === "completed"
                                  ? "success"
                                  : e.status === "in_progress"
                                    ? "brand"
                                    : "default"
                              }
                            >
                              {ENROLLMENT_STATUS_LABEL[e.status]}
                            </Badge>
                          </TD>
                          <TD className="w-32">
                            <ProgressBar value={e.attendanceRate} showLabel />
                          </TD>
                          <TD className="num pr-5">{e.score || "-"}</TD>
                        </TR>
                      );
                    })}
                  </TBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!modalProgram}
        onClose={() => setModalProgram(null)}
        title={modalProgram ? `${modalProgram.name} 수강신청` : ""}
        description="수강할 분반을 선택하세요."
      >
        {modalProgram && (
          <>
            <div className="space-y-2">
              {(coursesByProgram.get(modalProgram.id) ?? []).map((c) => {
                const enrolled = enrolledCourses.has(c.id);
                return (
                  <label
                    key={c.id}
                    className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 ${
                      selectedCourse === c.id ? "border-brand-300 bg-brand-50/40" : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="course"
                        checked={selectedCourse === c.id}
                        onChange={() => setSelectedCourse(c.id)}
                        className="h-4 w-4 accent-brand-700"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.schedule} · {c.location}</p>
                      </div>
                    </div>
                    {enrolled && <Badge variant="success">신청됨</Badge>}
                  </label>
                );
              })}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalProgram(null)}>취소</Button>
              <Button onClick={submit}>신청 완료</Button>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}
