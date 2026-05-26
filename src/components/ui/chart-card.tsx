import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  height?: number;
  className?: string;
  children: React.ReactNode;
}

/** recharts 등 차트를 감싸는 표준 카드 (제목 + 고정 높이 영역) */
export function ChartCard({
  title,
  subtitle,
  action,
  height = 260,
  className,
  children,
}: ChartCardProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
        </div>
        {action}
      </CardHeader>
      <CardContent className="flex-1">
        <div style={{ width: "100%", height }}>{children}</div>
      </CardContent>
    </Card>
  );
}
