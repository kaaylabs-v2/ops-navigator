import { Sparkles, AlertTriangle, Clock, Calendar, TrendingUp, Wallet, Target, User } from "lucide-react";
import type { Insights, InsightCard } from "@/lib/mock-api";

const ICONS = {
  "alert-triangle": AlertTriangle,
  clock: Clock,
  calendar: Calendar,
  "trending-up": TrendingUp,
  wallet: Wallet,
  target: Target,
  user: User,
} as const;

const SEVERITY = {
  critical: { dot: "var(--rose)", text: "text-foreground" },
  warning: { dot: "var(--amber)", text: "text-foreground" },
  info: { dot: "var(--sky)", text: "text-foreground" },
  positive: { dot: "var(--emerald)", text: "text-foreground" },
} as const;

export function Briefing({ data, loading }: { data: Insights | null; loading: boolean }) {
  return (
    <section className="card-surface card-hover p-6 animate-fade-up">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
          style={{ background: "oklch(0.66 0.22 290 / 0.15)", color: "var(--violet-glow)" }}>
          <Sparkles className={`size-3 ${loading ? "pulse-dot" : ""}`} />
          AI briefing
        </span>
      </div>

      {loading || !data ? (
        <p className="text-base text-muted-foreground">Generating intelligent insights…</p>
      ) : (
        <>
          <h2 className="text-xl font-semibold tracking-tight mb-5 leading-snug">
            {data.headline}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.cards.map((c, i) => <Card key={i} card={c} />)}
          </div>
        </>
      )}
    </section>
  );
}

function Card({ card }: { card: InsightCard }) {
  const Icon = ICONS[card.icon];
  const sev = SEVERITY[card.severity];
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 transition-colors hover:border-white/15">
      <div className="flex items-start gap-2.5 mb-1.5">
        <span className="size-2 rounded-full mt-1.5 shrink-0" style={{ background: sev.dot }} />
        <Icon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
        <h3 className={`font-semibold text-sm leading-tight ${sev.text}`}>{card.title}</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed pl-[18px]">{card.body}</p>
    </div>
  );
}
