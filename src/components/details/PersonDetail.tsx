import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
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
  const { db } = useData();
  const { account } = useAuth();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;

  // 상담·사연은 사업단(운영/관리자) 또는 본인만 열람 가능
  const privileged =
    account?.role === "operator" ||
    account?.role === "admin" ||
    (account?.role === "youth" && account.userId === user.id);
  const counselings = privileged ? userCounselings(db, user.id) : [];

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

        {/* 상담 내역 — 사업단·본인 전용 */}
        {privileged && (
          <Section title={`상담 내역 (${counselings.length}) · 사업단·본인 전용`}>
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
                      <span className="text-xs text-slate-400">{formatDate(c.date)}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600">{c.summary}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">다음 계획: {c.nextPlan}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>
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
