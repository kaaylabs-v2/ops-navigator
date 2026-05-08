import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, ChevronRight } from "lucide-react";
import { sendChat, type ChatMessage, type ChatAudit } from "@/lib/mock-api";

const SUGGESTIONS = [
  "Which 5 customers brought in the most revenue this year?",
  "How many calibrations are due next month, and who owns the most?",
  "Show me jobs that are overdue right now, sorted by days late.",
];

type Msg = ChatMessage & { audit?: ChatAudit[]; error?: boolean };

export function ChatPanel({ aiMode }: { aiMode: "claude" | "nexus" }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await sendChat(next);
      setMessages((m) => [...m, { role: "assistant", content: res.reply, audit: res.audit }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: `_Error: ${e?.message ?? "request failed"}_`, error: true }]);
    } finally {
      setLoading(false);
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
          </div>
        )}
        {messages.map((m, i) => <Bubble key={i} msg={m} />)}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="size-3 pulse-dot" style={{ color: "var(--ai-mark-fg)" }} />
            Thinking…
          </div>
        )}
      </div>

      <div className="px-5 pt-3 pb-2 border-t border-border shrink-0">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} disabled={loading}
              className="text-[10px] px-2 py-1 rounded-md border border-border hover:border-[var(--border-strong)] hover:bg-[var(--row-hover)] transition-colors text-muted-foreground hover:text-foreground text-left max-w-full truncate">
              {s.length > 42 ? s.slice(0, 42) + "…" : s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            rows={2}
            placeholder="Ask about jobs, calibrations, customers…"
            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[var(--border-strong)] placeholder:text-muted-foreground/60"
            style={{ minHeight: 60, background: "var(--input-bg)" }}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            className="p-2.5 rounded-lg disabled:opacity-40 transition-all"
            style={{
              background: "linear-gradient(135deg, var(--violet), var(--violet-glow))",
              color: "white",
            }}>
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Bubble({ msg }: { msg: Msg }) {
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
        <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderInline(msg.content) }} />
        {msg.audit && msg.audit.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border">
            <button onClick={() => setOpen(!open)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
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
                      <pre className="mono whitespace-pre-wrap text-muted-foreground overflow-x-auto">{a.input.sql}</pre>
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

function renderInline(s: string) {
  const escape = (t: string) => t.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
  return escape(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, '<em style="opacity:0.85">$1</em>');
}
