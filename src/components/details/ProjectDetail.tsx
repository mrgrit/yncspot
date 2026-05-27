import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { PortfolioProject } from "@/types";

const KIND_LABEL: Record<string, string> = {
  capstone: "캡스톤",
  practice: "실습",
  project: "프로젝트",
};

/** 포트폴리오 프로젝트·캡스톤 상세 (제목 클릭 시) */
export function ProjectDetailDialog({
  project,
  onClose,
}: {
  project: PortfolioProject | null;
  onClose: () => void;
}) {
  if (!project) return null;
  const d = project.detail;

  return (
    <Dialog open={!!project} onClose={onClose} title={project.title} className="max-w-lg">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {project.kind && (
            <Badge variant={project.kind === "capstone" ? "brand" : "outline"}>
              {KIND_LABEL[project.kind]}
            </Badge>
          )}
          {d && <Badge variant="outline">{d.period}</Badge>}
        </div>

        <p className="text-sm text-slate-600">{project.description}</p>

        {d && (
          <>
            <Block label="개요">{d.overview}</Block>
            <Block label="담당 역할">{d.role}</Block>
            <div>
              <p className="mb-1.5 text-sm font-semibold text-slate-700">사용 기술</p>
              <div className="flex flex-wrap gap-1.5">
                {d.stack.map((s) => (
                  <Badge key={s} variant="brand">{s}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-sm font-semibold text-slate-700">성과</p>
              <ul className="space-y-1">
                {d.outcomes.map((o) => (
                  <li key={o} className="flex gap-2 text-sm text-slate-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-xs text-slate-400">{formatDate(project.createdAt)}</span>
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-brand-700 hover:underline"
            >
              산출물 링크 <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </Dialog>
  );
}

export function useProjectDetail() {
  const [project, setProject] = useState<PortfolioProject | null>(null);
  return { project, open: setProject, close: () => setProject(null) };
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-sm font-semibold text-slate-700">{label}</p>
      <p className="text-sm text-slate-600">{children}</p>
    </div>
  );
}
