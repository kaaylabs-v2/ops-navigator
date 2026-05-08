import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, ChevronRight, Check, Loader2, RotateCcw, Plus } from "lucide-react";
import {
  sendChat,
  streamGenerateChart,
  type ChatMessage,
  type ChatAudit,
  type ChartSpec,
  type ChartGenEvent,
} from "@/lib/mock-api";
import { InlineChart } from "./InlineChart";

const QUESTION_SUGGESTIONS = [
  "Which 5 customers brought in the most revenue this year?",
  "How many calibrations are due next month, and who owns the most?",
  "Show me jobs that are overdue right now, sorted by days late.",
];

const PULSE_FLAG_KEY = "jm-gen-chip-seen";

type ChatMsg = ChatMessage & { audit?: ChatAudit[]; error?: boolean };

type Phase = { phase: string; message: string; doneAt?: number };

export type ChartGenMessage = {
  role: "assistant";
  kind: "chart-gen";
  prompt: string;
  state: "streaming" | "ready" | "suggestions" | "error";
  phases: Phase[];
  result?: { spec: ChartSpec; rows: any[]; rationale: string };
  suggestions?: string[];
  error?: { message: string; phase?: string; draftTitle?: string };
};

type Msg =
  | (ChatMsg & { kind?: "chat" })
  | ({ kind: "chart-gen" } & ChartGenMessage);

type Props = {
  aiMode: "claude" | "nexus";
  onAddChart?: (spec: ChartSpec, rows: any[]) => Promise<{ added: boolean }>;
};

export function ChatPanel({ aiMode, onAddChart }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pulseChip, setPulseChip] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPulseChip(localStorage.getItem(PULSE_FLAG_KEY) !== "1");
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function isChartRequest(text: string): { match: boolean; prompt: string } {
    const t = text.trim();
    const m = t.match(/^\/(chart|graph)\b\s*(.*)$/i);
    if (m) return { match: true, prompt: m[2].trim() };
    return { match: false, prompt: t };
  }

  function dismissPulse() {
    if (pulseChip) {
      setPulseChip(false);
      try {
        localStorage.setItem(PULSE_FLAG_KEY, "1");
      } catch {}
    }
  }

  function handleGenChipClick() {
    dismissPulse();
    setInput((cur) => (cur.startsWith("/chart ") ? cur : "/chart "));
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      const v = ta.value;
      ta.setSelectionRange(v.length, v.length);
    });
  }

  async function send(text?: string) {
    const raw = (text ?? input).trim();
    if (!raw || loading) return;

    const { match, prompt } = isChartRequest(raw);

    // Always abort any previous in-flight stream first.
    abortRef.current?.abort();

    if (match) {
      await runChartGen(prompt || "something cool");
      return;
    }

    // Normal chat path
    setInput("");
    setLoading(true);
    const next: Msg[] = [...messages, { role: "user", content: raw, kind: "chat" }];
    setMessages(next);
    try {
      const res = await sendChat(next as ChatMessage[]);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: res.reply, audit: res.audit, kind: "chat" },
      ]);
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `_Error: ${e?.message ?? "request failed"}_`,
          error: true,
          kind: "chat",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function runChartGen(prompt: string) {
    setInput("");
    setLoading(true);

    // Push the user message + a streaming placeholder.
    const userMsg: Msg = { role: "user", content: `/chart ${prompt}`, kind: "chat" };
    const placeholder: Msg = {
      kind: "chart-gen",
      role: "assistant",
      prompt,
      state: "streaming",
      phases: [],
    };
    setMessages((prev) => [...prev, userMsg, placeholder]);
    const placeholderIndex = messages.length + 1;

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const updatePlaceholder = (patch: (m: ChartGenMessage) => ChartGenMessage) => {
      setMessages((prev) => {
        const copy = prev.slice();
        const idx = copy.findIndex(
          (m, i) => i >= placeholderIndex && (m as any).kind === "chart-gen" && (m as any).state === "streaming",
        );
        const targetIdx = idx >= 0 ? idx : copy.length - 1;
        const target = copy[targetIdx] as any;
        if (!target || target.kind !== "chart-gen") return prev;
        copy[targetIdx] = patch(target) as any;
        return copy;
      });
    };

    try {
      await streamGenerateChart(
        prompt,
        (e: ChartGenEvent) => {
          if (e.event === "status") {
            updatePlaceholder((m) => {
              const phases = m.phases.slice();
              // mark previous phases done
              for (const p of phases) if (!p.doneAt) p.doneAt = Date.now();
              phases.push({ phase: e.data.phase, message: e.data.message });
              return { ...m, phases };
            });
          } else if (e.event === "ready") {
            updatePlaceholder((m) => {
              const phases = m.phases.map((p) => (p.doneAt ? p : { ...p, doneAt: Date.now() }));
              return { ...m, phases, state: "ready", result: e.data };
            });
          } else if (e.event === "suggestions") {
            updatePlaceholder((m) => ({
              ...m,
              phases: m.phases.map((p) => (p.doneAt ? p : { ...p, doneAt: Date.now() })),
              state: "suggestions",
              suggestions: e.data.suggestions,
            }));
          } else if (e.event === "error") {
            updatePlaceholder((m) => ({
              ...m,
              phases: m.phases.map((p) => (p.doneAt ? p : { ...p, doneAt: Date.now() })),
              state: "error",
              error: e.data,
            }));
          }
        },
        ctrl.signal,
      );
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        updatePlaceholder((m) => ({
          ...m,
          state: "error",
          error: { message: err?.message ?? "Stream failed" },
        }));
      }
    } finally {
      setLoading(false);
      if (abortRef.current === ctrl) abortRef.current = null;
    }
  }

  return (
    <div className="h-full flex flex-col card-surface overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold tracking-tight">Ask JM Test AI</h3>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border border-border"
          style={{ color: "var(--ai-mark-fg)", background: "var(--ai-mark-bg)" }}
        >
          <Sparkles className="size-2.5" />
          {aiMode === "claude" ? "Claude" : "Nexus"}
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-8 leading-relaxed">
            Ask anything about your operations.<br />
            The AI will write SQL, run it, and answer.
            <br />
            <br />
            Or click <span style={{ color: "var(--ai-mark-fg)" }}>✦ Generate Chart</span> below to
            build a new dashboard chart from a prompt.
          </div>
        )}
        {messages.map((m, i) =>
          (m as any).kind === "chart-gen" ? (
            <ChartGenBubble
              key={i}
              msg={m as ChartGenMessage}
              onRetry={() => runChartGen((m as ChartGenMessage).prompt)}
              onSuggestion={(s) => runChartGen(s)}
              onAdd={onAddChart}
            />
          ) : (
            <Bubble key={i} msg={m as ChatMsg} />
          ),
        )}
        {loading &&
          !messages.some(
            (m) => (m as any).kind === "chart-gen" && (m as any).state === "streaming",
          ) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="size-3 pulse-dot" style={{ color: "var(--ai-mark-fg)" }} />
              Thinking…
            </div>
          )}
      </div>

      <div className="px-5 pt-3 pb-2 border-t border-border shrink-0">
        <div className="flex flex-wrap gap-1.5 mb-2">
          <button
            onClick={handleGenChipClick}
            disabled={loading}
            className={`text-[10px] px-2 py-1 rounded-md border transition-colors text-left max-w-full truncate inline-flex items-center gap-1 ${
              pulseChip ? "gen-chip-pulse" : ""
            }`}
            style={{
              borderColor: "color-mix(in oklch, var(--violet) 45%, transparent)",
              color: "var(--ai-mark-fg)",
              background: "var(--ai-mark-bg)",
            }}
          >
            <Sparkles className="size-2.5" />
            Generate Chart
          </button>
          {QUESTION_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={loading}
              className="text-[10px] px-2 py-1 rounded-md border border-border hover:border-[var(--border-strong)] hover:bg-[var(--row-hover)] transition-colors text-muted-foreground hover:text-foreground text-left max-w-full truncate"
            >
              {s.length > 42 ? s.slice(0, 42) + "…" : s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            placeholder="Ask about jobs, calibrations, customers… or /chart"
            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[var(--border-strong)] placeholder:text-muted-foreground/60"
            style={{ minHeight: 60, background: "var(--input-bg)" }}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-lg disabled:opacity-40 transition-all"
            style={{
              background: "linear-gradient(135deg, var(--violet), var(--violet-glow))",
              color: "white",
            }}
          >
            <Send className="size-4" />
          </button>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground/70 leading-relaxed">
          Chart generation uses Claude regardless of your chat AI setting.
        </p>
      </div>
    </div>
  );
}

function Bubble({ msg }: { msg: ChatMsg }) {
  const [open, setOpen] = useState(false);
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser ? "text-white" : "border border-border text-foreground"
        }`}
        style={
          isUser
            ? { background: "linear-gradient(135deg, var(--violet), var(--violet-glow))" }
            : { background: "var(--input-bg)" }
        }
      >
        <div
          className="whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: renderInline(msg.content) }}
        />
        {msg.audit && msg.audit.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className={`size-3 transition-transform ${open ? "rotate-90" : ""}`} />
              {msg.audit.length} SQL {msg.audit.length === 1 ? "query" : "queries"} executed
            </button>
            {open && (
              <div className="mt-2 space-y-2">
                {msg.audit.map((a, i) => (
                  <div
                    key={i}
                    className="rounded-md p-2 text-[10.5px] border"
                    style={{ background: "var(--code-bg)", borderColor: "var(--code-border)" }}
                  >
                    {a.input.sql ? (
                      <pre className="mono whitespace-pre-wrap text-muted-foreground overflow-x-auto">
                        {a.input.sql}
                      </pre>
                    ) : (
                      <span className="mono text-muted-foreground">{a.tool}()</span>
                    )}
                    <div className="mt-1 text-[10px] text-muted-foreground/70">— {a.summary}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ChartGenBubble({
  msg,
  onRetry,
  onSuggestion,
  onAdd,
}: {
  msg: ChartGenMessage;
  onRetry: () => void;
  onSuggestion: (s: string) => void;
  onAdd?: (spec: ChartSpec, rows: any[]) => Promise<{ added: boolean }>;
}) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  async function handleAdd() {
    if (!msg.result || !onAdd || adding || added) return;
    setAdding(true);
    try {
      const res = await onAdd(msg.result.spec, msg.result.rows);
      if (res.added) setAdded(true);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex justify-start">
      <div
        className="max-w-[92%] w-full rounded-2xl px-3.5 py-3 text-sm leading-relaxed border border-border text-foreground"
        style={{
          background: "var(--input-bg)",
          borderLeft: "3px solid var(--violet)",
        }}
      >
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] mb-2"
          style={{ color: "var(--ai-mark-fg)" }}>
          <Sparkles className="size-2.5" />
          Chart generation
        </div>

        {/* Phases checklist */}
        <ul className="space-y-1.5">
          {msg.phases.map((p, i) => {
            const isDone = !!p.doneAt;
            const isActive = !isDone && msg.state === "streaming" && i === msg.phases.length - 1;
            return (
              <li
                key={`${p.phase}-${i}`}
                className="flex items-center gap-2 text-[12px] animate-slide-in-y"
              >
                {isDone ? (
                  <Check className="size-3" style={{ color: "var(--emerald)" }} />
                ) : isActive ? (
                  <Loader2 className="size-3 animate-spin" style={{ color: "var(--ai-mark-fg)" }} />
                ) : (
                  <span className="size-3 inline-block rounded-full border border-border" />
                )}
                <span className={isDone ? "text-muted-foreground" : "text-foreground"}>
                  {p.message}
                </span>
              </li>
            );
          })}
        </ul>

        {msg.state === "ready" && msg.result && (
          <div className="mt-3 space-y-3">
            <InlineChart spec={msg.result.spec} rows={msg.result.rows} height={260} />
            <p className="text-[12px] text-muted-foreground italic">{msg.result.rationale}</p>
            <div className="flex items-center gap-2 animate-slide-in-y">
              <button
                onClick={handleAdd}
                disabled={adding || added}
                className="px-3 py-1.5 rounded-md text-[11px] font-medium inline-flex items-center gap-1.5 disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, var(--violet), var(--violet-glow))",
                  color: "white",
                }}
              >
                {added ? (
                  <>
                    <Check className="size-3" /> Added
                  </>
                ) : adding ? (
                  <>
                    <Loader2 className="size-3 animate-spin" /> Adding…
                  </>
                ) : (
                  <>
                    <Plus className="size-3" /> Add to dashboard
                  </>
                )}
              </button>
              <button
                onClick={onRetry}
                className="px-3 py-1.5 rounded-md text-[11px] font-medium border border-border hover:border-[var(--border-strong)] inline-flex items-center gap-1.5"
              >
                <RotateCcw className="size-3" /> Try again
              </button>
            </div>
          </div>
        )}

        {msg.state === "suggestions" && msg.suggestions && (
          <div className="mt-3 space-y-2">
            <p className="text-[12px]">
              I couldn’t tell what you wanted. Did you mean one of these?
            </p>
            <div className="flex flex-wrap gap-1.5">
              {msg.suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => onSuggestion(s)}
                  className="text-[11px] px-2 py-1 rounded-md border transition-colors hover:border-[var(--border-strong)]"
                  style={{
                    borderColor: "color-mix(in oklch, var(--violet) 35%, transparent)",
                    color: "var(--ai-mark-fg)",
                    background: "var(--ai-mark-bg)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {msg.state === "error" && msg.error && (
          <div className="mt-3 space-y-2">
            <p className="text-[12px]">
              Sorry — I couldn’t build that chart. The closest I got was{" "}
              <strong>{msg.error.draftTitle ?? "a draft"}</strong>, but {msg.error.message}. Try
              rephrasing, or ask{" "}
              <code className="mono text-[11px]">/chart what can I plot from this data?</code> to
              see options.
            </p>
            <button
              onClick={onRetry}
              className="px-3 py-1.5 rounded-md text-[11px] font-medium border border-border hover:border-[var(--border-strong)] inline-flex items-center gap-1.5"
            >
              <RotateCcw className="size-3" /> Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function renderInline(s: string) {
  const escape = (t: string) =>
    t.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
  return escape(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, '<em style="opacity:0.85">$1</em>');
}
