import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Sparkles, Star, Timer, TrendingUp } from "lucide-react";
import { useMe } from "@/hooks/useMe";
import { useData } from "@/contexts/DataContext";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/feedback";
import {
  matchForUser,
  recommendedSpotsForUser,
  gradeProgress,
} from "@/lib/selectors";
import { GRADE_ORDER, calcReward } from "@/lib/reward";
import {
  BONUS_LABEL,
  GRADE_LABEL,
  formatCurrency,
} from "@/lib/utils";
import type { SpotJob } from "@/types";

const PAGE_SIZE = 12;

function MatchStars({ score }: { score: number }) {
  const filled = Math.round(score / 20);
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < filled ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
        />
      ))}
    </span>
  );
}

export default function SpotBoard() {
  const me = useMe();
  const { db } = useData();

  const [category, setCategory] = useState("all");
  const [district, setDistrict] = useState("all");
  const [duration, setDuration] = useState("all");
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [page, setPage] = useState(1);

  const employerById = useMemo(
    () => new Map(db.employers.map((e) => [e.id, e])),
    [db]
  );
  const categories = useMemo(
    () => [...new Set(db.spotJobs.map((j) => j.category))],
    [db]
  );
  const districts = useMemo(
    () => [...new Set(db.employers.map((e) => e.district))],
    [db]
  );

  const myEligible = (job: SpotJob) =>
    GRADE_ORDER.indexOf(me.spotGrade) >= GRADE_ORDER.indexOf(job.requiredGrade);

  const filtered = useMemo(() => {
    return db.spotJobs
      .filter((j) => j.status === "open")
      .filter((j) => category === "all" || j.category === category)
      .filter((j) => district === "all" || employerById.get(j.employerId)?.district === district)
      .filter((j) => {
        if (duration === "all") return true;
        const h = j.durationMin / 60;
        if (duration === "short") return h <= 3;
        if (duration === "mid") return h > 3 && h <= 5;
        return h > 5;
      })
      .filter((j) => !eligibleOnly || myEligible(j))
      .map((job) => ({ job, match: matchForUser(db, me, job) }))
      .sort((a, b) => b.match.score - a.match.score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, me, category, district, duration, eligibleOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const slice = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const nextSeq = me.spotCount + 1;
  const nextReward = calcReward(50000, nextSeq <= 3 ? (nextSeq as 1 | 2 | 3) : null);
  const gp = gradeProgress(me);

  return (
    <div>
      <PageHeader
        title="Spot Work"
        subtitle={`내 등급(${GRADE_LABEL[me.spotGrade]}) · 관심사 기반으로 정렬된 ${filtered.length}건의 일감`}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* 본문 */}
        <div className="lg:col-span-3">
          {/* 필터 */}
          <Card className="mb-4">
            <CardContent className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
              <Select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">전체 카테고리</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
              <Select
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">전체 지역</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>
              <Select
                value={duration}
                onChange={(e) => {
                  setDuration(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">전체 시간</option>
                <option value="short">3시간 이하</option>
                <option value="mid">3~5시간</option>
                <option value="long">5시간 초과</option>
              </Select>
              <label className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={eligibleOnly}
                  onChange={(e) => {
                    setEligibleOnly(e.target.checked);
                    setPage(1);
                  }}
                  className="h-4 w-4 accent-brand-700"
                />
                내 등급 가능
              </label>
            </CardContent>
          </Card>

          {slice.length === 0 ? (
            <EmptyState title="조건에 맞는 일감이 없습니다" description="필터를 조정해 보세요" />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {slice.map(({ job, match }) => {
                const emp = employerById.get(job.employerId);
                return (
                  <Link key={job.id} to={`/spot/${job.id}`}>
                    <Card className="h-full transition-shadow hover:shadow-md">
                      <CardContent className="flex h-full flex-col p-4">
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant="outline">{job.category}</Badge>
                          <MatchStars score={match.score} />
                        </div>
                        <p className="mt-2 line-clamp-2 font-semibold text-slate-900">
                          {job.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">{emp?.name}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {emp?.district}
                          </span>
                          <span className="flex items-center gap-1">
                            <Timer className="h-3 w-3" /> {Math.round(job.durationMin / 60)}시간
                          </span>
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-3">
                          <span className="num text-base font-bold text-slate-900">
                            {formatCurrency(job.baseWage)}
                          </span>
                          {!myEligible(job) && (
                            <Badge variant="warning">
                              {GRADE_LABEL[job.requiredGrade]} 필요
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={current === 1}
                onClick={() => setPage(current - 1)}
              >
                이전
              </Button>
              <span className="num px-3 text-sm text-slate-500">
                {current} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={current === totalPages}
                onClick={() => setPage(current + 1)}
              >
                다음
              </Button>
            </div>
          )}
        </div>

        {/* 사이드바 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>내 Spot 등급</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant="accent" className="text-sm">
                <Star className="h-3.5 w-3.5" /> {GRADE_LABEL[me.spotGrade]}
              </Badge>
              <p className="text-sm text-slate-600">누적 {me.spotCount}회 수행</p>
              <div className="rounded-2xl bg-slate-50 p-3 text-sm">
                <p className="flex items-center gap-1.5 font-medium text-slate-700">
                  <TrendingUp className="h-4 w-4 text-accent" /> 다음 보상
                </p>
                <p className="mt-1 text-slate-500">
                  {nextReward.type
                    ? `${BONUS_LABEL[nextReward.type]} (+${formatCurrency(nextReward.amount)})`
                    : "기본 일당"}
                </p>
                {gp.next && (
                  <p className="mt-1 text-xs text-slate-400">
                    {GRADE_LABEL[gp.next as keyof typeof GRADE_LABEL]}까지 {gp.remaining}회
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>추천 일감</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recommendedSpotsForUser(db, me, 3).map(({ job, match }) => (
                <Link
                  key={job.id}
                  to={`/spot/${job.id}`}
                  className="block rounded-2xl border border-slate-100 p-3 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{job.category}</Badge>
                    <MatchStars score={match.score} />
                  </div>
                  <p className="mt-1.5 line-clamp-1 text-sm font-medium text-slate-800">
                    {job.title}
                  </p>
                  {match.reasons.length > 0 && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-brand-700">
                      <Sparkles className="h-3 w-3" /> {match.reasons.slice(0, 2).join(" · ")}
                    </p>
                  )}
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
