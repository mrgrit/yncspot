import { useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import type { Counseling, CounselingType } from "@/types";
import {
  learningSummary,
  userBadges,
  userCounselings,
  userEnrollments,
  userPortfolio,
  userSpotHistory,
} from "@/lib/selectors";
import {
  GRADE_LABEL,
  STATUS_LABEL,
  TRACK_LABEL,
  ENROLLMENT_STATUS_LABEL,
  formatCurrency,
  formatDate,
} from "@/lib/utils";

const COUNSELING_LABEL: Record<string, string> = {
  intake: "초기",
  regular: "정기",
  career: "진로",
  psych: "심리",
  job: "취업",
};

/** 참여자/수료생 상세 (이름 클릭 시) — 전 역할 화면에서 재사용 */
export function PersonDetailDialog({
  userId,
  onClose,
}: {
  userId: string | null;
  onClose: () => void;
}) {
  const { db, addCounseling, updateCounseling } = useData();
  const { account } = useAuth();
  const { toast } = useToast();

  // 상담 등록/수정 폼 상태 (운영/관리자 전용)
  type CForm = {
    type: CounselingType;
    counselor: string;
    date: string; // yyyy-mm-dd
    summary: string;
    note: string;
    nextPlan: string;
  };
  const blankForm: CForm = {
    type: "regular",
    counselor: "",
    date: new Date().toISOString().slice(0, 10),
    summary: "",
    note: "",
    nextPlan: "",
  };
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<CForm>(blankForm);
  // 다른 사용자 다이얼로그가 열리면 폼 초기화
  useEffect(() => {
    setEditingId(null);
  }, [userId]);

  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;

  // 상담·사연은 사업단(운영/관리자) 또는 본인만 열람 가능
  const privileged =
    account?.role === "operator" ||
    account?.role === "admin" ||
    (account?.role === "youth" && account.userId === user.id);
  // 등록/수정은 운영자·관리자만 가능
  const canEdit = account?.role === "operator" || account?.role === "admin";
  const counselings = privileged ? userCounselings(db, user.id) : [];

  const openNew = () => {
    setForm({ ...blankForm, counselor: account?.name ?? "" });
    setEditingId("new");
  };
  const openEdit = (c: Counseling) => {
    setForm({
      type: c.type,
      counselor: c.counselor,
      date: c.date.slice(0, 10),
      summary: c.summary,
      note: c.note,
      nextPlan: c.nextPlan,
    });
    setEditingId(c.id);
  };
  const closeForm = () => setEditingId(null);
  const saveForm = () => {
    if (!form.summary.trim()) {
      toast("요약을 입력하세요", "error");
      return;
    }
    const isoDate = new Date(form.date + "T10:00:00.000Z").toISOString();
    const payload = {
      type: form.type,
      counselor: form.counselor.trim() || "상담사",
      date: isoDate,
      summary: form.summary.trim(),
      note: form.note.trim(),
      nextPlan: form.nextPlan.trim(),
    };
    if (editingId === "new") {
      addCounseling({ userId: user.id, ...payload });
      toast("상담이 등록되었습니다");
    } else if (editingId) {
      updateCounseling(editingId, payload);
      toast("상담이 수정되었습니다");
    }
    setEditingId(null);
  };

  const enr = userEnrollments(db, user.id);
  const spots = userSpotHistory(db, user.id).slice(0, 5);
  const chats = db.chatSessions.filter((c) => c.userId === user.id);
  const badges = userBadges(db, user.id);
  const pf = userPortfolio(db, user.id);
  const capstone = pf?.projects.find((p) => p.kind === "capstone");
  const learn = learningSummary(db, user.id);
  const programById = new Map(db.programs.map((p) => [p.id, p]));
  const courseProgram = new Map(db.courses.map((c) => [c.id, c.programId]));
  const jobById = new Map(db.spotJobs.map((j) => [j.id, j]));

  return (
    <Dialog open={!!userId} onClose={onClose} className="max-w-2xl">
      <div className="space-y-4">
        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <Avatar name={user.name} color={user.avatarColor} size="lg" />
          <div>
            <p className="text-lg font-bold text-slate-900">{user.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge variant={user.track === "try_job" ? "try" : "get"}>
                {TRACK_LABEL[user.track]}
              </Badge>
              <Badge variant="default">{STATUS_LABEL[user.status]}</Badge>
              <Badge variant="accent">{GRADE_LABEL[user.spotGrade]}</Badge>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-600">{user.bio}</p>

        {/* 기본 정보 */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 text-sm sm:grid-cols-3">
          <Info label="소속/학과" value={user.school} />
          <Info label="목표 직무" value={user.goal} />
          <Info label="이수/시간" value={`${learn.completedCount}과목 · ${learn.hours}h`} />
          <Info label="Spot 등급" value={`${GRADE_LABEL[user.spotGrade]} (${user.spotCount}회)`} />
          <Info label="통합플랫폼" value={user.nais_registered ? "등재" : "미등재"} />
          <Info label="구직준비도" value={user.gov24_assessed ? `${user.gov24_score}점` : "미검사"} />
        </div>

        {/* 역량 */}
        {user.skills.length > 0 && (
          <Section title="보유 역량">
            <div className="flex flex-wrap gap-1.5">
              {user.skills.map((s) => (
                <Badge key={s} variant="brand">{s}</Badge>
              ))}
            </div>
          </Section>
        )}

        {/* 페르소나 / 상황 — 사업단·본인 전용 */}
        {privileged && (
          <Section title="상황 · 사연">
            <div className="mb-1.5 flex flex-wrap gap-1.5">
              <Badge variant={user.rested ? "warning" : "outline"}>
                {user.rested ? "쉬었음" : "구직"} · {user.situation}
              </Badge>
            </div>
            <p className="text-sm text-slate-600">{user.story}</p>
            <p className="mt-1 text-xs text-slate-500">신청 계기: {user.motivation}</p>
          </Section>
        )}

        {/* 캡스톤 */}
        {capstone && (
          <Section title="캡스톤 산출물">
            <div className="rounded-2xl border border-brand-100 bg-brand-50/40 p-3">
              <p className="text-sm font-semibold text-slate-800">{capstone.title}</p>
              {capstone.detail && (
                <>
                  <p className="mt-1 text-xs text-slate-500">{capstone.detail.overview}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {capstone.detail.role} · {capstone.detail.stack.join(", ")} · {capstone.detail.period}
                  </p>
                </>
              )}
            </div>
          </Section>
        )}

        {/* 학습 이력 */}
        <Section title={`학습 이력 (${enr.length})`}>
          {enr.length === 0 ? (
            <Empty />
          ) : (
            enr.slice(0, 6).map((e) => (
              <Row
                key={e.id}
                left={programById.get(courseProgram.get(e.courseId)!)?.name ?? "과정"}
                right={`${ENROLLMENT_STATUS_LABEL[e.status]} · 출석 ${e.attendanceRate}%`}
              />
            ))
          )}
        </Section>

        {/* Spot 이력 */}
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

        {/* 배지 / AI 상담 */}
        <div className="grid grid-cols-2 gap-3">
          <Section title={`디지털 배지 (${badges.length})`}>
            {badges.length === 0 ? <Empty /> : (
              <div className="flex flex-wrap gap-1">
                {badges.slice(0, 6).map((b) => (
                  <Badge key={b.id} variant="outline">{b.name}</Badge>
                ))}
              </div>
            )}
          </Section>
          <Section title={`AI 상담 (${chats.length})`}>
            {chats.length === 0 ? <Empty /> : (
              chats.slice(0, 3).map((c) => (
                <Row key={c.id} left={c.title} right={`${c.messages.length}개`} />
              ))
            )}
          </Section>
        </div>

        {/* 상담 내역 — 사업단·본인 열람 / 등록·수정은 운영자/관리자만 */}
        {privileged && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">
                상담 내역 ({counselings.length}) · 사업단·본인 전용
              </p>
              {canEdit && !editingId && (
                <Button size="sm" variant="outline" onClick={openNew}>
                  <Plus className="h-3.5 w-3.5" /> 상담 추가
                </Button>
              )}
            </div>

            {editingId && (
              <div className="mb-2 space-y-2 rounded-2xl border border-brand-200 bg-brand-50/40 p-3">
                <p className="text-sm font-semibold text-slate-700">
                  {editingId === "new" ? "새 상담 등록" : "상담 수정"}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="종류">
                    <Select
                      value={form.type}
                      onChange={(e) =>
                        setForm({ ...form, type: e.target.value as CounselingType })
                      }
                    >
                      {(Object.keys(COUNSELING_LABEL) as CounselingType[]).map((k) => (
                        <option key={k} value={k}>
                          {COUNSELING_LABEL[k]} 상담
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="상담사">
                    <Input
                      value={form.counselor}
                      onChange={(e) => setForm({ ...form, counselor: e.target.value })}
                      placeholder="담당 상담사"
                    />
                  </Field>
                </div>
                <Field label="일자">
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </Field>
                <Field label="요약">
                  <Textarea
                    value={form.summary}
                    onChange={(e) => setForm({ ...form, summary: e.target.value })}
                    placeholder="상담 요약"
                  />
                </Field>
                <Field label="메모(선택)">
                  <Textarea
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                  />
                </Field>
                <Field label="다음 계획">
                  <Input
                    value={form.nextPlan}
                    onChange={(e) => setForm({ ...form, nextPlan: e.target.value })}
                    placeholder="예) 추천 과목 수강"
                  />
                </Field>
                <div className="flex justify-end gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={closeForm}>
                    취소
                  </Button>
                  <Button size="sm" onClick={saveForm}>
                    저장
                  </Button>
                </div>
              </div>
            )}

            {counselings.length === 0 ? (
              <Empty />
            ) : (
              <div className="space-y-1.5">
                {counselings.map((c) => (
                  <div key={c.id} className="rounded-xl bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        {COUNSELING_LABEL[c.type]} 상담 · {c.counselor}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-400">{formatDate(c.date)}</span>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => openEdit(c)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                            aria-label="수정"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600">{c.summary}</p>
                    {c.note && (
                      <p className="mt-0.5 text-[11px] text-slate-500">메모: {c.note}</p>
                    )}
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      다음 계획: {c.nextPlan}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}

/** userId state 를 내장한 간편 훅 (페이지에서 setPerson(id) 로 열기) */
export function usePersonDetail() {
  const [userId, setUserId] = useState<string | null>(null);
  return {
    userId,
    open: (id: string) => setUserId(id),
    close: () => setUserId(null),
  };
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="font-medium text-slate-700">{value}</p>
    </div>
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
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[11px] text-slate-500">{label}</span>
      {children}
    </label>
  );
}
