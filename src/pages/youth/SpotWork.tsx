import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bot, FileText, Star, Upload } from "lucide-react";
import { useMe } from "@/hooks/useMe";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/feedback";
import { formatCurrency } from "@/lib/utils";
import type { OutputField } from "@/types";

type Values = Record<string, string | string[] | number>;

export default function SpotWork() {
  const { id } = useParams();
  const navigate = useNavigate();
  const me = useMe();
  const { db, submitAiTask, submittedAiJobs } = useData();
  const { toast } = useToast();
  const [values, setValues] = useState<Values>({});
  const [errors, setErrors] = useState<Set<string>>(new Set());

  const job = db.spotJobs.find((j) => j.id === id);
  const employer = job ? db.employers.find((e) => e.id === job.employerId) : undefined;
  const guideBlocks = useMemo(
    () => (job?.aiTask ? job.aiTask.guideMd.split("\n") : []),
    [job]
  );

  if (!job || !job.aiTask) {
    return (
      <EmptyState
        title="AI 검수 작업을 찾을 수 없습니다"
        action={
          <Link to="/spot">
            <Button>Spot 목록</Button>
          </Link>
        }
      />
    );
  }
  const aiTask = job.aiTask;
  const done = submittedAiJobs.has(job.id);

  const setVal = (key: string, v: string | string[] | number) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const submit = () => {
    const missing = new Set<string>();
    for (const f of aiTask.fields) {
      if (!f.required) continue;
      const v = values[f.key];
      const empty =
        v === undefined ||
        v === "" ||
        (Array.isArray(v) && v.length === 0);
      if (empty) missing.add(f.key);
    }
    if (missing.size > 0) {
      setErrors(missing);
      toast("필수 항목을 모두 입력하세요", "error");
      return;
    }
    submitAiTask(me.id, job.id, job.baseWage);
    toast(`검수 결과가 제출되었습니다 · ${formatCurrency(job.baseWage)} 지급 (자동 통과)`);
    navigate("/spot/history");
  };

  return (
    <div>
      <Link
        to={`/spot/${job.id}`}
        className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> 작업 상세
      </Link>

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <Badge variant="brand">
          <Bot className="h-3 w-3" /> AI 검수
        </Badge>
        <Badge variant="outline">{aiTask.domainLabel}</Badge>
        <Badge variant="outline">예상 {aiTask.estimatedMin}분</Badge>
        <Badge variant="accent">건당 {formatCurrency(job.baseWage)}</Badge>
      </div>
      <h1 className="text-xl font-bold text-slate-900">{job.title}</h1>
      <p className="mt-0.5 text-sm text-slate-400">{employer?.name}</p>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 좌측 가이드 (sticky) */}
        <div className="lg:sticky lg:top-16 lg:self-start">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <FileText className="h-4 w-4 text-brand-700" />
              <CardTitle>검수 가이드</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 text-sm leading-relaxed text-slate-600">
                {guideBlocks.map((line, i) => <GuideLine key={i} line={line} />)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 우측 동적 출력 폼 */}
        <Card>
          <CardHeader>
            <CardTitle>검수 결과 제출</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {done ? (
              <EmptyState
                title="이미 제출한 작업입니다"
                description="검수 결과가 자동 통과 처리되었습니다."
                action={
                  <Link to="/spot/history">
                    <Button size="sm">정산 내역 보기</Button>
                  </Link>
                }
              />
            ) : (
              <>
                {aiTask.fields.map((f) => (
                  <Field
                    key={f.key}
                    field={f}
                    value={values[f.key]}
                    error={errors.has(f.key)}
                    onChange={(v) => setVal(f.key, v)}
                  />
                ))}
                <div className="flex justify-end gap-2 pt-1">
                  <Link to={`/spot/${job.id}`}>
                    <Button variant="outline">취소</Button>
                  </Link>
                  <Button variant="accent" onClick={submit}>
                    검수 결과 제출
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GuideLine({ line }: { line: string }) {
  const t = line.trim();
  if (t === "") return <div className="h-1" />;
  if (t.startsWith("## ")) return <p className="pt-1 text-sm font-semibold text-slate-800">{t.slice(3)}</p>;
  if (/^\d+\.\s/.test(t)) return <p className="pl-3 text-slate-600">• {t.replace(/^\d+\.\s/, "")}</p>;
  if (t.startsWith("- ")) return <p className="pl-3 text-slate-600">• {t.slice(2)}</p>;
  return <p className="text-slate-600">{t}</p>;
}

function Field({
  field,
  value,
  error,
  onChange,
}: {
  field: OutputField;
  value: string | string[] | number | undefined;
  error: boolean;
  onChange: (v: string | string[] | number) => void;
}) {
  const labelEl = (
    <span className="mb-1 block text-sm font-medium text-slate-700">
      {field.label}
      {field.required && <span className="ml-0.5 text-warning">*</span>}
    </span>
  );
  const ring = error ? "ring-2 ring-warning rounded-2xl" : "";

  return (
    <label className="block">
      {labelEl}
      {field.helperText && (
        <span className="mb-1 block text-xs text-slate-400">{field.helperText}</span>
      )}
      <div className={ring}>
        {renderInput(field, value, onChange)}
      </div>
    </label>
  );
}

function renderInput(
  field: OutputField,
  value: string | string[] | number | undefined,
  onChange: (v: string | string[] | number) => void
) {
  switch (field.kind) {
    case "text_short":
    case "url":
      return (
        <Input
          type={field.kind === "url" ? "url" : "text"}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.kind === "url" ? "https://..." : ""}
        />
      );
    case "text_long":
      return (
        <Textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "command_output":
      return (
        <Textarea
          className="font-mono text-xs"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="$ nft list ruleset"
        />
      );
    case "json":
      return (
        <Textarea
          className="font-mono text-xs"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder='{ }'
        />
      );
    case "rating":
      return <RatingInput value={(value as number) ?? 0} onChange={onChange} />;
    case "yes_no":
      return (
        <div className="flex gap-2">
          {["예", "아니오"].map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              className={`flex-1 rounded-2xl border px-3 py-2 text-sm ${
                value === o ? "border-brand-300 bg-brand-50 text-brand-800" : "border-slate-200 text-slate-600"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      );
    case "choice_single":
      return (
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              className={`rounded-2xl border px-3 py-1.5 text-sm ${
                value === o ? "border-brand-300 bg-brand-50 text-brand-800" : "border-slate-200 text-slate-600"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      );
    case "choice_multi": {
      const arr = (value as string[]) ?? [];
      const toggle = (o: string) =>
        onChange(arr.includes(o) ? arr.filter((x) => x !== o) : [...arr, o]);
      return (
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => toggle(o)}
              className={`rounded-2xl border px-3 py-1.5 text-sm ${
                arr.includes(o) ? "border-brand-300 bg-brand-50 text-brand-800" : "border-slate-200 text-slate-600"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      );
    }
    case "screenshot":
      return <FileInput value={value as string} onChange={onChange} />;
    default:
      return null;
  }
}

function RatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <Star className={`h-6 w-6 ${n <= value ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
        </button>
      ))}
    </div>
  );
}

function FileInput({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-500 hover:bg-slate-50">
      <Upload className="h-4 w-4" />
      {value ? `첨부됨: ${value}` : "이미지 캡처 업로드 (드래그/클릭)"}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0]?.name ?? "screenshot.png")}
      />
    </label>
  );
}
