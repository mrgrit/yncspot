import { useMemo, useState } from "react";
import {
  Award,
  Clock,
  Download,
  FolderGit2,
  GraduationCap,
  Link2,
  Share2,
  Sparkles,
  Star,
} from "lucide-react";
import { useMe } from "@/hooks/useMe";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/feedback";
import { Avatar } from "@/components/ui/avatar";
import {
  learningSummary,
  spotByCategory,
  userBadges,
  userPortfolio,
} from "@/lib/selectors";
import {
  GRADE_LABEL,
  TRACK_LABEL,
  formatCurrency,
  formatDate,
} from "@/lib/utils";

export default function Portfolio() {
  const me = useMe();
  const { db } = useData();
  const { toast } = useToast();
  const [shareOpen, setShareOpen] = useState(false);

  const learning = useMemo(() => learningSummary(db, me.id), [db, me]);
  const spotCats = useMemo(() => spotByCategory(db, me.id), [db, me]);
  const badges = useMemo(() => userBadges(db, me.id), [db, me]);
  const pf = useMemo(() => userPortfolio(db, me.id), [db, me]);

  const shareUrl = `https://share.mock.${"ync-jump.spot"}/p/${pf?.id ?? me.id}`;

  const copy = () => {
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    toast("공유 링크가 복사되었습니다");
  };

  const exportPdf = () => {
    toast("PDF 내보내기를 시작합니다 (mock)", "info");
    setTimeout(() => window.print(), 200);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="내 포트폴리오"
        subtitle="학습 이력 · Spot 일경험 · 디지털 배지 자동 집계"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
              <Share2 className="h-4 w-4" /> 공유 카드
            </Button>
            <Button size="sm" onClick={exportPdf}>
              <Download className="h-4 w-4" /> PDF 내보내기
            </Button>
          </>
        }
      />

      {/* 헤더 카드 */}
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <Avatar name={me.name} color={me.avatarColor} size="lg" />
          <div>
            <p className="text-lg font-bold text-slate-900">{me.name}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Badge variant={me.track === "try_job" ? "try" : "get"}>
                {TRACK_LABEL[me.track]}
              </Badge>
              <Badge variant="accent">
                <Star className="h-3 w-3" /> {GRADE_LABEL[me.spotGrade]}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 요약 통계 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<GraduationCap className="h-4 w-4" />} label="이수 과목" value={`${learning.completedCount}개`} />
        <Stat icon={<Clock className="h-4 w-4" />} label="교육 시간" value={`${learning.hours}h`} />
        <Stat icon={<Star className="h-4 w-4" />} label="평균 점수" value={`${learning.avgScore}`} />
        <Stat icon={<Sparkles className="h-4 w-4" />} label="Spot 수행" value={`${me.spotCount}회`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Spot 카테고리별 */}
        <Card>
          <CardHeader>
            <CardTitle>Spot 일경험 (카테고리별)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {spotCats.length === 0 ? (
              <EmptyState title="Spot 이력이 없습니다" />
            ) : (
              spotCats.map((c) => (
                <div
                  key={c.category}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{c.category}</p>
                    <p className="text-xs text-slate-400">{c.count}회</p>
                  </div>
                  <span className="num text-sm font-semibold text-emerald-600">
                    {formatCurrency(c.paid)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 프로젝트 */}
        <Card>
          <CardHeader>
            <CardTitle>프로젝트 결과물</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!pf || pf.projects.length === 0 ? (
              <EmptyState title="등록된 프로젝트가 없습니다" icon={<FolderGit2 className="h-6 w-6" />} />
            ) : (
              pf.projects.map((pr) => (
                <div
                  key={pr.id}
                  className={`rounded-2xl border p-3 ${pr.kind === "capstone" ? "border-brand-200 bg-brand-50/40" : "border-slate-100"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800">{pr.title}</p>
                    {pr.kind === "capstone" && <Badge variant="brand">캡스톤</Badge>}
                    {pr.kind === "practice" && <Badge variant="outline">실습</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{pr.description}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{formatDate(pr.createdAt)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* 과정 중 배운 것 (수료생 보존) */}
      {pf?.learnings && pf.learnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>과정 중 배운 것</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {pf.learnings.map((l) => (
                <Badge key={l} variant="brand">{l}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 배지 갤러리 */}
      <Card>
        <CardHeader>
          <CardTitle>디지털 배지 갤러리 ({badges.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {badges.length === 0 ? (
            <EmptyState title="배지가 없습니다" icon={<Award className="h-6 w-6" />} />
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {badges.map((b) => (
                <div key={b.id} className="rounded-2xl border border-slate-100 p-3 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                    <Award className="h-6 w-6" />
                  </span>
                  <p className="mt-2 line-clamp-2 text-xs font-medium text-slate-700">{b.name}</p>
                  <p className="text-[11px] capitalize text-slate-400">{b.level}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 공유 카드 모달 */}
      <Dialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="공유 카드 만들기"
        description="협약기업에 1-click으로 포트폴리오를 공유할 수 있는 링크입니다. (mock)"
      >
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <Avatar name={me.name} color={me.avatarColor} />
            <div>
              <p className="font-semibold text-slate-900">{me.name}</p>
              <p className="text-xs text-slate-500">
                {TRACK_LABEL[me.track]} · {GRADE_LABEL[me.spotGrade]} · 이수 {learning.completedCount}과목 · 배지 {badges.length}개
              </p>
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Input readOnly value={shareUrl} className="flex-1" />
          <Button onClick={copy}>
            <Link2 className="h-4 w-4" /> 복사
          </Button>
        </div>
      </Dialog>
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
