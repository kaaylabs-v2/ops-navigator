import {
  Briefcase, CheckCircle2, Clock, AlertTriangle,
  CalendarDays, DollarSign, Wallet, Target,
} from "lucide-react";
import type { KpiData } from "@/lib/mock-api";

type Tile = {
  label: string;
  value: string;
  icon: React.ElementType;
  accent?: string;
};

export function KpiTiles({ data, loading }: { data: KpiData | null; loading: boolean }) {
  const k = data?.kpis;

  const tiles: Tile[] = [
    { label: "Active jobs", value: k ? String(k.activeJobs) : "—", icon: Briefcase },
    { label: "Completed MTD", value: k ? String(k.completedMtd) : "—", icon: CheckCircle2 },
    { label: "Avg turnaround", value: k ? `${k.avgTurnaroundDays.toFixed(1)}d` : "—", icon: Clock },
    {
      label: "Jobs past due",
      value: k ? String(k.overdueJobs) : "—",
      icon: AlertTriangle,
      accent: k && k.overdueJobs > 0 ? "var(--rose)" : undefined,
    },
    { label: "Calibrations ≤30d", value: k ? String(k.dueSoon30) : "—", icon: CalendarDays },
    { label: "Revenue MTD", value: k ? `$${k.revenueMtd.toLocaleString()}` : "—", icon: DollarSign },
    { label: "Outstanding A/R", value: k ? `$${k.outstandingAr.toLocaleString()}` : "—", icon: Wallet },
    {
      label: "On-time %",
      value: k ? `${k.onTimePct.toFixed(1)}%` : "—",
      icon: Target,
      accent: k ? (k.onTimePct >= 90 ? "var(--emerald)" : k.onTimePct < 75 ? "var(--amber)" : undefined) : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 animate-fade-up">
      {tiles.map((t) => {
        const Icon = t.icon;
        return (
          <div key={t.label} className="card-surface card-hover p-4">
            <div className="flex items-start justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {t.label}
              </span>
              <Icon className="size-3.5 text-muted-foreground" />
            </div>
            <div
              className="text-2xl font-semibold tabular tracking-tight"
              style={t.accent ? { color: t.accent } : undefined}
            >
              {loading ? <Skeleton /> : t.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Skeleton() {
  return <span className="inline-block h-7 w-16 rounded bg-muted animate-pulse" />;
}
