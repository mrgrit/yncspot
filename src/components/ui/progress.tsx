import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0~100
  className?: string;
  color?: string;
  showLabel?: boolean;
}

export function ProgressBar({
  value,
  className,
  color = "#1E40AF",
  showLabel = false,
}: ProgressBarProps) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-100", className)}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${v}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <span className="num w-10 shrink-0 text-right text-xs font-medium text-slate-500">
          {Math.round(v)}%
        </span>
      )}
    </div>
  );
}
