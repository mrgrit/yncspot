import { useMemo, useState } from "react";
import { Building2, Plus, Users } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { companyStats } from "@/lib/selectors";
import type { Company } from "@/types";

let cmpSeq = 9000;

export default function Companies() {
  const { db, addCompany } = useData();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    industry: "",
    size: "중소기업" as Company["size"],
    address: "부산광역시 남구",
    departments: "",
    quota: 3,
  });

  const stats = useMemo(() => {
    const m = new Map<string, ReturnType<typeof companyStats>>();
    for (const c of db.companies) m.set(c.id, companyStats(db, c.id));
    return m;
  }, [db]);

  const submit = () => {
    if (!form.name.trim()) {
      toast("기업명을 입력하세요", "error");
      return;
    }
    const company: Company = {
      id: `cmp_${++cmpSeq}`,
      name: form.name.trim(),
      industry: form.industry || "기타",
      size: form.size,
      address: form.address,
      matchedDepartments: form.departments
        ? form.departments.split(",").map((s) => s.trim()).filter(Boolean)
        : ["기타"],
      hiringQuota: Number(form.quota) || 0,
      contactPerson: "신규 담당자",
      contactEmail: "recruit@example.com",
    };
    addCompany(company);
    setOpen(false);
    setForm({ name: "", industry: "", size: "중소기업", address: "부산광역시 남구", departments: "", quota: 3 });
    toast("협약기업이 등록되었습니다");
  };

  return (
    <div>
      <PageHeader
        title="협약기업"
        subtitle={`${db.companies.length}개 기업`}
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> 신규 기업 등록
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {db.companies.map((c) => {
          const s = stats.get(c.id)!;
          return (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <Badge variant="outline">{c.size}</Badge>
                </div>
                <p className="mt-2 font-semibold text-slate-900">{c.name}</p>
                <p className="text-xs text-slate-400">{c.industry} · {c.address}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.matchedDepartments.slice(0, 3).map((d) => (
                    <Badge key={d} variant="brand">{d}</Badge>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
                  <MiniStat label="공고" value={s.postings} />
                  <MiniStat label="매칭" value={s.matched} />
                  <MiniStat label="채용" value={s.hired} highlight />
                </div>
                <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                  <Users className="h-3 w-3" /> 채용목표 {c.hiringQuota}명 · 멘토링 {s.mentorships}건
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="신규 협약기업 등록">
        <div className="space-y-3">
          <Field label="기업명">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="예) 부산테크" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="업종">
              <Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="예) IT" />
            </Field>
            <Field label="규모">
              <Select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value as Company["size"] })}>
                <option>대기업</option>
                <option>중견기업</option>
                <option>중소기업</option>
                <option>공공기관</option>
              </Select>
            </Field>
          </div>
          <Field label="주소">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="매칭 학과 (쉼표로 구분)">
            <Input value={form.departments} onChange={(e) => setForm({ ...form, departments: e.target.value })} placeholder="예) AI, 디자인" />
          </Field>
          <Field label="채용 목표 인원">
            <Input type="number" value={form.quota} onChange={(e) => setForm({ ...form, quota: Number(e.target.value) })} />
          </Field>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>취소</Button>
          <Button onClick={submit}>등록</Button>
        </div>
      </Dialog>
    </div>
  );
}

function MiniStat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div>
      <p className={`num text-base font-bold ${highlight ? "text-emerald-600" : "text-slate-900"}`}>{value}</p>
      <p className="text-[11px] text-slate-400">{label}</p>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}
