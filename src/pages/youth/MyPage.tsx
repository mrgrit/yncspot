import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  Check,
  MessageCircle,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { BRAND, THEME } from "@/config/brand";
import { useMe } from "@/hooks/useMe";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/feedback";
import {
  gradeProgress,
  recommendedPrograms,
  userAreaProgress,
  userBadges,
  userSpotHistory,
} from "@/lib/selectors";
import { GRADE_RULES, GRADE_ORDER } from "@/lib/reward";
import {
  AREA_LABEL,
  GRADE_LABEL,
  LEVEL_LABEL,
  TRACK_LABEL,
  formatCurrency,
  fromNow,
} from "@/lib/utils";

export default function MyPage() {
  const me = useMe();
  const { db } = useData();

  const areas = useMemo(() => userAreaProgress(db, me), [db, me]);
  const recs = useMemo(() => recommendedPrograms(db, me, 3), [db, me]);
  const spots = useMemo(() => userSpotHistory(db, me.id).slice(0, 3), [db, me]);
  const badges = useMemo(() => userBadges(db, me.id).slice(0, 4), [db, me]);
  const gp = gradeProgress(me);

  const trackColor = me.track === "try_job" ? THEME.trackTryJob : THEME.trackGetJob;

  const gradeFraction = useMemo(() => {
    if (!gp.next) return 100;
    const curMin = GRADE_RULES.find((r) => r.grade === me.spotGrade)?.minCount ?? 0;
    const nextMin = GRADE_RULES.find((r) => r.grade === gp.next)?.minCount ?? curMin + 1;
    return Math.min(100, Math.max(0, ((me.spotCount - curMin) / (nextMin - curMin)) * 100));
  }, [gp, me]);

  return (
    <div className="space-y-4">
      {/* 환영 + 등급 */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={me.name} color={me.avatarColor} size="lg" />
            <div>
              <p className="text-lg font-bold text-slate-900">
                안녕하세요, {me.name}님
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge variant={me.track === "try_job" ? "try" : "get"}>
                  {TRACK_LABEL[me.track]} 트랙
                </Badge>
                <Badge variant="accent">
                  <Star className="h-3 w-3" /> {GRADE_LABEL[me.spotGrade]} Spot
                </Badge>
              </div>
            </div>
          </div>
          <Link to="/chat" className="shrink-0">
            <Button variant="accent">
              <MessageCircle className="h-4 w-4" /> AI 코치 '{BRAND.displayName}'에게 물어보기
            </Button>
          </Link>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 좌측 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>이수 진척 (3영역 동시이수)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {areas.map((a) => (
                <div key={a.bucket}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      {a.done && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                      {a.bucket}
                      <span className="text-xs text-slate-400">
                        ({a.areas.map((x) => AREA_LABEL[x]).join("·")})
                      </span>
                    </span>
                    <span className="num text-xs font-medium text-slate-500">
                      {a.completed}/{a.total}
                    </span>
                  </div>
                  <ProgressBar
                    value={(a.completed / a.total) * 100}
                    color={a.done ? THEME.success : THEME.primary}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>다음 추천 과목</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recs.length === 0 ? (
                <EmptyState title="추천할 과목이 없습니다" description="대부분의 과정을 이수하셨어요!" />
              ) : (
                recs.map((p) => (
                  <Link
                    key={p.id}
                    to="/courses"
                    className="flex items-center justify-between rounded-2xl border border-slate-100 p-3 hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-400">
                        {LEVEL_LABEL[p.level]} · {AREA_LABEL[p.area]} · {p.hours}시간
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300" />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Spot 등급 진척</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  {GRADE_LABEL[me.spotGrade]}
                  {gp.next && (
                    <>
                      <ArrowRight className="h-3 w-3 text-slate-300" />
                      {GRADE_LABEL[gp.next as keyof typeof GRADE_LABEL]}
                    </>
                  )}
                </span>
                <span className="num text-xs text-slate-500">{me.spotCount}회 수행</span>
              </div>
              <ProgressBar value={gradeFraction} color={THEME.accent} />
              <p className="mt-2 text-xs text-slate-500">
                {gp.next
                  ? `${GRADE_LABEL[gp.next as keyof typeof GRADE_LABEL]}까지 ${gp.remaining}회 남았습니다`
                  : "최고 등급에 도달했습니다 🎉"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 우측 */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>최근 Spot 활동</CardTitle>
              <Link to="/spot/history" className="text-xs text-brand-700 hover:underline">
                전체 보기
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {spots.length === 0 ? (
                <EmptyState
                  title="아직 Spot 이력이 없어요"
                  description="첫 Spot Work를 시작해 보세요"
                  icon={<Sparkles className="h-6 w-6" />}
                  action={
                    <Link to="/spot">
                      <Button size="sm" variant="accent">Spot 찾기</Button>
                    </Link>
                  }
                />
              ) : (
                spots.map((h) => {
                  const job = db.spotJobs.find((j) => j.id === h.jobId);
                  return (
                    <div
                      key={h.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-100 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {job?.title ?? "Spot"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {fromNow(h.completedAt)} · ★ {h.rating.toFixed(1)}
                        </p>
                      </div>
                      <span className="num shrink-0 text-sm font-semibold text-emerald-600">
                        {formatCurrency(h.totalPaid)}
                      </span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>디지털 배지</CardTitle>
              <Link to="/me/badges" className="text-xs text-brand-700 hover:underline">
                전체 보기
              </Link>
            </CardHeader>
            <CardContent>
              {badges.length === 0 ? (
                <EmptyState title="아직 배지가 없어요" icon={<Award className="h-6 w-6" />} />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {badges.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-2 rounded-2xl border border-slate-100 p-3"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <Award className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-slate-700">{b.name}</p>
                        <p className="text-[11px] capitalize text-slate-400">{b.level}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Link to="/me/portfolio">
            <Card className="transition-colors hover:bg-slate-50">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm font-semibold text-slate-800">내 포트폴리오</p>
                  <p className="text-xs text-slate-400">학습·일경험·배지를 한눈에</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
