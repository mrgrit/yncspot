import * as React from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  spark?: number[];
  trend?: number; // % 증감 (양수=상승)
  color?: string;
}

export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  spark,
  trend,
  color = "#1E40AF",
}: KpiCardProps) {
  const data = React.useMemo(
    () => (spark ?? []).map((v, i) => ({ i, v })),
    [spark]
  );
  const gid = React.useId().replace(/:/g, "");

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <p className="text-sm text-slate-500">{label}</p>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-1.5 flex items-end justify-between gap-2">
          <p className="num text-3xl font-bold text-slate-900">{value}</p>
          {data.length > 1 && (
            <div className="h-10 w-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
                  <defs>
                    <linearGradient id={`sp-${gid}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={color}
                    strokeWidth={2}
                    fill={`url(#sp-${gid})`}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          {typeof trend === "number" && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium",
                trend >= 0 ? "text-emerald-600" : "text-red-500"
              )}
            >
              {trend >= 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {Math.abs(trend)}%
            </span>
          )}
          {sub && <span className="text-xs text-slate-400">{sub}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
