import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, MapPin, Star, Timer, Wallet } from "lucide-react";
import { useMe } from "@/hooks/useMe";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { matchForUser } from "@/lib/selectors";
import { GRADE_ORDER, calcReward } from "@/lib/reward";
import {
  BONUS_LABEL,
  GRADE_LABEL,
  SPOTJOB_STATUS_LABEL,
  formatCurrency,
} from "@/lib/utils";

export default function SpotDetail() {
  const { id } = useParams();
  const me = useMe();
  const { db, applySpot, appliedSpots } = useData();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const job = db.spotJobs.find((j) => j.id === id);
  const employer = job ? db.employers.find((e) => e.id === job.employerId) : undefined;
  const match = useMemo(
    () => (job ? matchForUser(db, me, job) : null),
    [db, me, job]
  );

  if (!job) {
    return (
      <EmptyState
        title="일감을 찾을 수 없습니다"
        action={
          <Link to="/spot">
            <Button>목록으로</Button>
          </Link>
        }
      />
    );
  }

  const eligible =
    GRADE_ORDER.indexOf(me.spotGrade) >= GRADE_ORDER.indexOf(job.requiredGrade);
  const applied = appliedSpots.has(job.id);
  const nextSeq = me.spotCount + 1;
  const reward = calcReward(job.baseWage, nextSeq <= 3 ? (nextSeq as 1 | 2 | 3) : null);

  const submit = () => {
    applySpot(job.id);
    setOpen(false);
    setReason("");
    toast("신청이 완료되었습니다");
  };

  return (
    <div className="space-y-4">
      <Link to="/spot" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Spot 목록
      </Link>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Badge variant="outline">{job.category}</Badge>
              <h1 className="mt-2 text-xl font-bold text-slate-900">{job.title}</h1>
              <p className="mt-1 text-sm text-slate-500">{employer?.name}</p>
            </div>
            <Badge variant={job.status === "open" ? "success" : "default"}>
              {SPOTJOB_STATUS_LABEL[job.status]}
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Info icon={<Wallet className="h-4 w-4" />} label="기본 일당" value={formatCurrency(job.baseWage)} />
            <Info icon={<Timer className="h-4 w-4" />} label="소요 시간" value={`${Math.round(job.durationMin / 60)}시간`} />
            <Info icon={<MapPin className="h-4 w-4" />} label="지역" value={employer?.district ?? "-"} />
            <Info icon={<Star className="h-4 w-4" />} label="요구 등급" value={GRADE_LABEL[job.requiredGrade]} />
          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate-600">{job.description}</p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button
              variant="accent"
              disabled={applied || job.status !== "open"}
              onClick={() => setOpen(true)}
            >
              {applied ? (
                <>
                  <Check className="h-4 w-4" /> 신청완료
                </>
              ) : (
                "신청하기"
              )}
            </Button>
            {!eligible && (
              <span className="text-sm text-warning">
                {GRADE_LABEL[job.requiredGrade]} 등급부터 신청 가능합니다
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>매칭 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex items-center gap-2">
              <span className="num text-2xl font-bold text-slate-900">{match?.score ?? 0}</span>
              <span className="text-sm text-slate-400">/ 100점</span>
            </div>
            <div className="space-y-1.5 text-sm">
              <MatchRow label="등급 충족" value={match?.breakdown.grade ?? 0} max={30} />
              <MatchRow label="관심사 일치" value={match?.breakdown.interest ?? 0} max={25} />
              <MatchRow label="가까운 위치" value={match?.breakdown.distance ?? 0} max={20} />
              <MatchRow label="재수행 발주처" value={match?.breakdown.repeatEmployer ?? 0} max={15} />
              <MatchRow label="발주처 평판" value={match?.breakdown.rating ?? 0} max={10} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>발주처 & 보상</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
              <div>
                <p className="text-sm font-medium text-slate-800">{employer?.name}</p>
                <p className="text-xs text-slate-400">{employer?.category} · {employer?.district}</p>
              </div>
              <span className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {employer?.rating.toFixed(1)}
              </span>
            </div>
            <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-3">
              <p className="text-sm font-medium text-amber-800">예상 보상 (다음 {nextSeq}회차)</p>
              <p className="num mt-1 text-lg font-bold text-slate-900">
                {formatCurrency(job.baseWage + reward.amount)}
              </p>
              <p className="text-xs text-amber-700">
                기본 일당 {formatCurrency(job.baseWage)}
                {reward.type && ` + ${BONUS_LABEL[reward.type]}`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Spot 신청"
        description={`'${job.title}'에 신청합니다. 간단한 지원 사유를 적어주세요.`}
      >
        <Textarea
          placeholder="예) 카페 근무 경험이 있어 빠르게 적응할 수 있습니다."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>취소</Button>
          <Button variant="accent" onClick={submit}>신청 완료</Button>
        </div>
      </Dialog>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <span className="flex items-center gap-1 text-xs text-slate-400">{icon} {label}</span>
      <p className="num mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function MatchRow({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      <span className={`num font-medium ${value > 0 ? "text-emerald-600" : "text-slate-300"}`}>
        +{value} <span className="text-xs text-slate-300">/ {max}</span>
      </span>
    </div>
  );
}
