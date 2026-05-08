import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { getIcon } from "@/lib/icons";
import type { Insights, InsightCard } from "@/lib/mock-api";

type Props = { data: Insights | null; loading: boolean };

const SEVERITY_COLOR: Record<InsightCard["severity"], string> = {
  critical: "var(--rose)",
  warning: "var(--amber)",
  info: "var(--sky)",
  positive: "var(--emerald)",
};

// Pure helper — extract a leading stat token + a short uppercase label
// from a title like "12 instruments are past calibration date".
export function formatStatFromTitle(title: string): {
  stat: string | null;
  label: string;
  fullTitle: string;
} {
  const trimmed = title.trim();
  // Match: optional sign, optional $, number with commas/decimals, optional unit (%, k, M, x, days, etc.)
  const re = /^([+-]?\$?\d[\d,]*(?:\.\d+)?)(\s*(%|k|K|M|x|×))?/;
  const m = trimmed.match(re);
  if (!m) return { stat: null, label: trimmed, fullTitle: trimmed };

  const rawNum = m[1];
  const unit = m[3] ?? "";
  const sign = rawNum.startsWith("+") || rawNum.startsWith("-") ? rawNum[0] : "";
  const hasDollar = rawNum.includes("$");
  const numeric = Number(rawNum.replace(/[+\-$,]/g, ""));

  let statBody: string;
  if (Number.isNaN(numeric)) {
    statBody = rawNum.replace(/^[+-]/, "");
  } else if (hasDollar && numeric >= 1000) {
    statBody =
      numeric >= 1_000_000
        ? `$${(numeric / 1_000_000).toFixed(numeric >= 10_000_000 ? 0 : 1)}M`
        : `$${Math.round(numeric / 1000)}k`;
  } else if (hasDollar) {
    statBody = `$${numeric}`;
  } else if (unit) {
    statBody = `${numeric}${unit}`;
  } else {
    statBody = `${numeric}`;
  }
  const stat = `${sign}${statBody}`;

  // Strip the matched stat from the title, then drop a leading filler word.
  let rest = trimmed.slice(m[0].length).trim();
  rest = rest.replace(/^(of|are|is|jobs|instruments|items|techs?|technicians?)\s+/i, "");
  // Take the first 2–4 words for the label.
  const words = rest.split(/\s+/).filter(Boolean).slice(0, 4);
  const label = (words.join(" ") || rest || trimmed).toUpperCase();

  return { stat, label, fullTitle: trimmed };
}

function useNow(active: boolean) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

export function Briefing({ data, loading }: Props) {
  const now = useNow(!loading && !!data);
  const ts = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const headline =
    data?.headline ?? "Operational pulse — what needs your attention right now.";
  const cards = data?.cards ?? [];

  return (
    <section
      aria-label="AI briefing"
      className="card-surface p-6 lg:p-7 animate-fade-up"
    >
      {/* Zone 1 — eyebrow */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <span
            className="inline-flex items-center justify-center size-6 rounded-md"
            style={{
              background: "var(--ai-mark-bg)",
              border: "1px solid color-mix(in oklch, var(--violet) 35%, transparent)",
            }}
            aria-hidden
          >
            <Sparkles className="size-3.5" style={{ color: "var(--ai-mark-fg)" }} />
          </span>
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: "var(--ai-mark-fg)" }}
            aria-hidden
          >
            AI Briefing
          </span>
        </div>
        <div className="flex items-center gap-1.5 mono text-[10px] text-muted-foreground tabular">
          {loading || !data ? (
            <>
              <span
                className="size-1.5 rounded-full pulse-dot"
                style={{ background: "var(--violet-glow)" }}
              />
              <span>SYNCING</span>
            </>
          ) : (
            <>
              <span
                className="size-1.5 rounded-full pulse-dot"
                style={{ background: "var(--emerald)" }}
              />
              <span>UPDATED · {ts}</span>
            </>
          )}
        </div>
      </div>

      {/* Zone 2 — hero */}
      <div className="relative pl-5 mb-7">
        <span
          aria-hidden
          className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full"
          style={{
            background:
              "linear-gradient(180deg, var(--violet-glow), oklch(0.66 0.22 290 / 0.4))",
          }}
        />
        <div
          className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2"
          aria-hidden
        >
          Executive take
        </div>
        {loading || !data ? (
          <div className="space-y-2 max-w-[720px]">
            <div className="h-7 w-3/4 bg-muted animate-pulse rounded" />
            <div className="h-7 w-1/2 bg-muted animate-pulse rounded" />
          </div>
        ) : (
          <h2
            className="font-semibold tracking-tight text-foreground max-w-[720px]"
            style={{ fontSize: "clamp(1.375rem, 1.05rem + 0.9vw, 1.625rem)", lineHeight: 1.25 }}
          >
            {headline}
          </h2>
        )}
      </div>

      {/* Zone 3 — supporting cards */}
      {loading || !data ? (
        <CardGridSkeleton />
      ) : cards.length === 0 ? (
        data.headline ? null : (
          <p className="text-xs text-muted-foreground">
            Operations look quiet — no active alerts.
          </p>
        )
      ) : (
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gridAutoRows: "1fr",
          }}
        >
          {cards.map((c, i) => (
            <StatCard key={i} card={c} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}

function StatCard({ card, index }: { card: InsightCard; index: number }) {
  const { stat, label, fullTitle } = formatStatFromTitle(card.title);
  const Icon = getIcon(card.icon);
  const color = SEVERITY_COLOR[card.severity];

  return (
    <button
      type="button"
      aria-label={fullTitle}
      className="group relative text-left rounded-lg border border-border bg-transparent pl-4 pr-4 py-3.5 transition-colors duration-200 hover:border-[var(--border-strong)] focus:outline-none focus-visible:border-[var(--border-strong)] focus-visible:ring-1 focus-visible:ring-ring/40 animate-fade-up h-full flex flex-col"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <span
        aria-hidden
        className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full"
        style={{ background: color }}
      />
      <div className="flex items-baseline gap-2 mb-1.5">
        {stat ? (
          <span
            className="text-[26px] leading-none font-semibold tracking-tight tabular text-foreground"
            title={fullTitle}
          >
            {stat}
          </span>
        ) : (
          <Icon className="size-6" style={{ color }} aria-hidden />
        )}
      </div>
      <div
        className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2"
        title={fullTitle}
      >
        {stat ? label : fullTitle}
      </div>
      <p
        className="text-xs text-muted-foreground leading-relaxed mt-auto"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {card.body}
      </p>
    </button>
  );
}

function CardGridSkeleton() {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="relative rounded-lg border border-white/[0.06] pl-4 pr-4 py-3.5 h-[112px] overflow-hidden"
        >
          <span className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-white/10" />
          <div className="h-6 w-12 bg-white/5 animate-pulse rounded mb-2" />
          <div className="h-2 w-20 bg-white/5 animate-pulse rounded mb-3" />
          <div className="h-2 w-full bg-white/5 animate-pulse rounded mb-1.5" />
          <div className="h-2 w-2/3 bg-white/5 animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}
