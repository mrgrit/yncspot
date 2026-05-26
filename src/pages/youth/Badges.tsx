import { useMemo } from "react";
import { Award, ExternalLink } from "lucide-react";
import { useMe } from "@/hooks/useMe";
import { useData } from "@/contexts/DataContext";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { userBadges } from "@/lib/selectors";
import { formatDate } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  course_completion: "교육 이수",
  capstone: "캡스톤",
  spot_milestone: "Spot 마일스톤",
  mentoring: "멘토링",
  track_transfer: "트랙 전환",
};

const LEVEL_COLOR: Record<string, string> = {
  bronze: "#B45309",
  silver: "#64748B",
  gold: "#F59E0B",
  platinum: "#0EA5E9",
};

export default function Badges() {
  const me = useMe();
  const { db } = useData();
  const badges = useMemo(() => userBadges(db, me.id), [db, me]);

  return (
    <div>
      <PageHeader title="디지털 배지" subtitle={`총 ${badges.length}개의 배지를 획득했습니다`} />

      {badges.length === 0 ? (
        <EmptyState title="아직 배지가 없습니다" icon={<Award className="h-6 w-6" />} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${LEVEL_COLOR[b.level]}22`, color: LEVEL_COLOR[b.level] }}
                >
                  <Award className="h-7 w-7" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800">{b.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline">{TYPE_LABEL[b.type] ?? b.type}</Badge>
                    <span className="text-xs capitalize text-slate-400">{b.level}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">발급일 {formatDate(b.issuedAt)}</p>
                  <a
                    href={b.certUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-brand-700 hover:underline"
                  >
                    인증서 보기 <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
