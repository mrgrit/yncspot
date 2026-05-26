import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bot, KeyRound, Send, Sparkles } from "lucide-react";
import { BRAND } from "@/config/brand";
import { useMe } from "@/hooks/useMe";
import { useData } from "@/contexts/DataContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "@/components/ui/avatar";
import {
  AI_KEY_STORAGE,
  buildUserContext,
  callAnthropic,
  detectAction,
  fallbackReply,
  type ChatAction,
  type ChatTurn,
} from "@/lib/ai";

interface Msg {
  id: number;
  role: "user" | "assistant";
  content: string;
  action?: ChatAction | null;
}

const SUGGESTIONS = [
  "이수하려면 뭐 더 들어야 해?",
  "이번 주 추천 Spot 알려줘",
  "내 포트폴리오 어때?",
  "쿠팡 CFS 지원하려면?",
];

export default function Chat() {
  const me = useMe();
  const { db } = useData();
  const { toast } = useToast();
  const ctx = useMemo(() => buildUserContext(db, me), [db, me]);

  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 0,
      role: "assistant",
      content: `안녕하세요, ${me.name}님. 진로 코치 '${BRAND.displayName}'입니다.\n이수 요건, 맞춤 Spot, 포트폴리오, 진로에 대해 무엇이든 물어보세요.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem(AI_KEY_STORAGE) ?? "";
    } catch {
      return "";
    }
  });
  const idRef = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const saveKey = (k: string) => {
    setApiKey(k);
    try {
      if (k) localStorage.setItem(AI_KEY_STORAGE, k);
      else localStorage.removeItem(AI_KEY_STORAGE);
    } catch {
      /* storage 불가 환경 */
    }
    setKeyOpen(false);
    toast(k ? "API 키가 저장되었습니다" : "API 키가 삭제되었습니다");
  };

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const userMsg: Msg = { id: idRef.current++, role: "user", content: q };
    const history: ChatTurn[] = messages
      .filter((m) => m.id !== 0)
      .map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setBusy(true);

    let reply: string;
    if (apiKey) {
      try {
        reply = await callAnthropic(apiKey, ctx, history, q);
      } catch {
        reply = fallbackReply(q, ctx);
        toast("AI 호출 실패 — 오프라인 응답으로 대체했습니다", "info");
      }
    } else {
      reply = fallbackReply(q, ctx);
    }

    setMessages((prev) => [
      ...prev,
      { id: idRef.current++, role: "assistant", content: reply, action: detectAction(q) },
    ]);
    setBusy(false);
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 9rem)" }}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-800 text-white">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <p className="font-bold text-slate-900">AI 코치 {BRAND.displayName}</p>
            <p className="text-xs text-slate-400">
              {apiKey ? "Anthropic API 연결됨" : "오프라인 응답 모드 (API 키 미설정)"}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setKeyOpen(true)}>
          <KeyRound className="h-4 w-4" /> API 키
        </Button>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {m.role === "assistant" ? (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <Sparkles className="h-4 w-4" />
                </span>
              ) : (
                <Avatar name={me.name} color={me.avatarColor} size="sm" />
              )}
              <div className={`max-w-[78%] ${m.role === "user" ? "items-end" : ""}`}>
                <div
                  className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-brand-800 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {m.content}
                </div>
                {m.action && (
                  <Link to={m.action.to}>
                    <Button variant="outline" size="sm" className="mt-2">
                      {m.action.label} <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="rounded-2xl bg-slate-100 px-4 py-3">
                <span className="flex gap-1">
                  <Dot /> <Dot /> <Dot />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 추천 질문 */}
        <div className="flex flex-wrap gap-1.5 border-t border-slate-100 px-4 py-2.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={busy}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        {/* 입력 */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-slate-100 p-3"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메시지를 입력하세요"
            disabled={busy}
          />
          <Button type="submit" disabled={busy || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Card>

      <Dialog
        open={keyOpen}
        onClose={() => setKeyOpen(false)}
        title="Anthropic API 키 설정"
        description="키를 입력하면 실제 Claude 응답을 사용합니다. 비워두면 오프라인 규칙 기반 응답으로 동작합니다."
      >
        <KeyForm initial={apiKey} onSave={saveKey} />
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
          <Badge variant="outline">모델</Badge> {/* AI_MODEL 은 lib/ai.ts 에서 관리 */}
          claude-sonnet-4
        </div>
      </Dialog>
    </div>
  );
}

function KeyForm({ initial, onSave }: { initial: string; onSave: (k: string) => void }) {
  const [val, setVal] = useState(initial);
  return (
    <div className="flex gap-2">
      <Input
        type="password"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="sk-ant-..."
        className="flex-1"
      />
      <Button onClick={() => onSave(val.trim())}>저장</Button>
    </div>
  );
}

function Dot() {
  return <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />;
}
