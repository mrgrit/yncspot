import { useMemo } from "react";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { monthlyActivity, reportFigures, restedRatio } from "@/lib/selectors";

export default function Reports() {
  const { db } = useData();
  const { toast } = useToast();
  const f = useMemo(() => reportFigures(db), [db]);
  const m = useMemo(() => monthlyActivity(db), [db]);
  const rested = useMemo(() => restedRatio(db), [db]);

  const figures = [
    { label: "누적 양성인원", value: `${f.trained}명` },
    { label: "'쉬었음' 청년 비율", value: `${rested.pct}%` },
    { label: "교육 이수율", value: `${f.completionRate}%` },
    { label: "중도 탈락률", value: `${f.dropoutRate}%` },
    { label: "취업률(수료생)", value: `${f.employRate}%` },
    { label: "Spot 매칭 누적", value: `${f.spotTotal}건` },
    { label: "협약기업 채용", value: `${f.hired}명` },
    { label: "만족도", value: `${f.satisfaction} / 5.0` },
  ];

  const exportMock = (kind: string) =>
    toast(`${kind} 내보내기를 생성합니다 (mock)`, "info");

  const periods = [
    { value: "monthly", label: "월간", note: "2026년 5월 기준" },
    { value: "quarterly", label: "분기", note: "2026년 2분기 누적" },
    { value: "annual", label: "연간", note: "2026년 누적" },
  ];

  return (
    <div>
      <PageHeader
        title="보고서 · 통계"
        subtitle="양성인원·이수율·취업률·Spot·만족도 자동 집계"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => exportMock("PDF")}>
              <FileDown className="h-4 w-4" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportMock("Excel")}>
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </Button>
          </>
        }
      />

      <Tabs defaultValue="monthly">
        <TabsList>
          {periods.map((p) => (
            <TabsTrigger key={p.value} value={p.value}>{p.label}</TabsTrigger>
          ))}
        </TabsList>

        {periods.map((p) => (
          <TabsContent key={p.value} value={p.value}>
            <p className="mb-3 text-sm text-slate-400">{p.note} · 지표 총괄표</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {figures.map((fig) => (
                <Card key={fig.label}>
                  <CardContent className="p-4">
                    <p className="text-sm text-slate-500">{fig.label}</p>
                    <p className="num mt-1 text-2xl font-bold text-slate-900">{fig.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="mt-4">
              <CardContent className="px-0">
                <Table>
                  <THead>
                    <TR>
                      <TH className="pl-5">월</TH>
                      <TH>신규가입</TH>
                      <TH>Spot수행</TH>
                      <TH>이수자</TH>
                      <TH className="pr-5">채용</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {m.map((row) => (
                      <TR key={row.key}>
                        <TD className="pl-5 font-medium text-slate-800">{row.label}</TD>
                        <TD className="num">{row.signups}</TD>
                        <TD className="num">{row.spots}</TD>
                        <TD className="num">{row.completions}</TD>
                        <TD className="num pr-5">{row.hired}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
