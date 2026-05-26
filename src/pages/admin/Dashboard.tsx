import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Award,
  Building2,
  Smile,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  UserPlus,
  GraduationCap,
  CircleDot,
} from "lucide-react";
import { GRADE_COLORS } from "@/config/brand";
import { useData } from "@/contexts/DataContext";
import { PageHeader } from "@/components/common/PageHeader";
import { KpiCard } from "@/components/charts/KpiCard";
import { ChartCard } from "@/components/ui/chart-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import {
  companyHiringActivity,
  dashboardKpis,
  gradeByMonth,
  monthlyActivity,
  programCompletionRates,
  recentActivity,
  trackDistribution,
} from "@/lib/selectors";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  fromNow,
} from "@/lib/utils";

const FEED_ICON = {
  signup: UserPlus,
  spot: Sparkles,
  course: GraduationCap,
  placement: Building2,
  badge: Award,
} as const;

export default function Dashboard() {
  const { db } = useData();

  const m = useMemo(() => monthlyActivity(db), [db]);
  const k = useMemo(() => dashboardKpis(db), [db]);
  const track = useMemo(() => trackDistribution(db), [db]);
  const programs = useMemo(() => programCompletionRates(db), [db]);
  const grades = useMemo(() => gradeByMonth(db), [db]);
  const companies = useMemo(() => companyHiringActivity(db, 8), [db]);
  const feed = useMemo(() => recentActivity(db, 30), [db]);

  const totalUsers = track.reduce((s, t) => s + t.value, 0);
  const lastTrend = (sel: (r: (typeof m)[number]) => number) => {
    const a = sel(m[m.length - 2] ?? m[0]);
    const b = sel(m[m.length - 1] ?? m[0]);
    if (!a) return undefined;
    return Math.round(((b - a) / a) * 100);
  };

  const totalPaid = useMemo(
    () => db.spotHistory.reduce((s, h) => s + h.totalPaid, 0),
    [db]
  );

  return (
    <div>
      <PageHeader
        title="통합 대시보드"
        subtitle="사업 KPI · 트랙별 진행 · Spot/교육/채용 활동 현황"
      />

      {/* KPI 6 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="누적 양성인원"
          value={`${formatNumber(k.trained)}명`}
          sub={`목표 ${k.trainedTarget}명 · ${formatPercent((k.trained / k.trainedTarget) * 100, 1)}`}
          icon={Users}
          spark={m.map((r) => r.cumSignups)}
          trend={lastTrend((r) => r.signups)}
        />
        <KpiCard
          label="활성 참여자"
          value={`${formatNumber(k.active)}명`}
          sub="최근 30일 활동"
          icon={UserCheck}
          spark={m.map((r) => r.signups)}
          trend={lastTrend((r) => r.signups)}
          color="#0EA5E9"
        />
        <KpiCard
          label="취업률 (Get Job)"
          value={formatPercent(k.employRate, 1)}
          sub={`취업 확정 ${k.employed}명`}
          icon={TrendingUp}
          spark={m.map((r) => r.cumHired)}
          color="#10B981"
        />
        <KpiCard
          label="Spot Work 누적"
          value={`${formatNumber(k.spotTotal)}건`}
          sub={`이번달 ${k.spotThisMonth}건 · 정산 ${formatCurrency(totalPaid)}`}
          icon={Sparkles}
          spark={m.map((r) => r.spots)}
          trend={lastTrend((r) => r.spots)}
          color="#F59E0B"
        />
        <KpiCard
          label="협약기업 채용"
          value={`${formatNumber(k.hired)}명`}
          sub="채용 확정 누적"
          icon={Building2}
          spark={m.map((r) => r.cumHired)}
          color="#8B5CF6"
        />
        <KpiCard
          label="만족도"
          value={`${k.satisfaction.toFixed(1)} / 5.0`}
          sub={`응답 ${formatNumber(k.satisfactionCount)}건`}
          icon={Smile}
          spark={m.map((r) => r.avgRating)}
          color="#EC4899"
        />
      </div>

      {/* 메인 차트 2열 */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="월별 활동 추이" subtitle="신규가입 · Spot수행 · 이수자" className="lg:col-span-2" height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={m} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="signups" name="신규가입" stroke="#1E40AF" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="spots" name="Spot수행" stroke="#F59E0B" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="completions" name="이수자" stroke="#10B981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="트랙별 참여 현황" subtitle="Try Job vs Get Job" height={280}>
          <div className="relative h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={track}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {track.map((t) => (
                    <Cell key={t.name} fill={t.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-6">
              <span className="num text-2xl font-bold text-slate-900">{totalUsers}</span>
              <span className="text-xs text-slate-400">총 참여자</span>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* 하단 3열 */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="교육 프로그램별 이수율" subtitle="12개 프로그램" height={360}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={programs}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis
                type="category"
                dataKey="name"
                width={118}
                tick={{ fontSize: 10, fill: "#64748b" }}
              />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Bar dataKey="rate" name="이수율" radius={[0, 6, 6, 0]} fill="#1E40AF" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Spot Grade 분포" subtitle="가입 월별 등급 구성" height={360}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={grades} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="bronze" name="Bronze" stackId="g" fill={GRADE_COLORS.bronze} />
              <Bar dataKey="silver" name="Silver" stackId="g" fill={GRADE_COLORS.silver} />
              <Bar dataKey="gold" name="Gold" stackId="g" fill={GRADE_COLORS.gold} />
              <Bar dataKey="platinum" name="Platinum" stackId="g" fill={GRADE_COLORS.platinum} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card>
          <CardHeader>
            <CardTitle>협약기업 채용 활동</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <THead>
                <TR>
                  <TH className="pl-5">기업</TH>
                  <TH>매칭</TH>
                  <TH>채용</TH>
                  <TH className="pr-5">비율</TH>
                </TR>
              </THead>
              <TBody>
                {companies.map((c) => (
                  <TR key={c.id}>
                    <TD className="pl-5 font-medium text-slate-800">{c.name}</TD>
                    <TD className="num">{c.matched}</TD>
                    <TD className="num text-emerald-600">{c.hired}</TD>
                    <TD className="num pr-5">{c.ratio}%</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 최근 활동 피드 */}
      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center gap-2">
          <CircleDot className="h-4 w-4 text-brand-700" />
          <CardTitle>최근 활동</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
            {feed.map((e) => {
              const Icon = FEED_ICON[e.type];
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                    {e.text}
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">{fromNow(e.at)}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
