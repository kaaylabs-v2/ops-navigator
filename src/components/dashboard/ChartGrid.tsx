import { useEffect, useState } from "react";
import { ChartRenderer } from "./ChartRenderers";
import type { ChartSpec, KpiData } from "@/lib/mock-api";
import { fetchDashboardSpec } from "@/lib/mock-api";

type SpecChart = { spec: ChartSpec; rows: any[] };

type Props = {
  // KpiData kept for back-compat / loading signal; chart data now comes from the spec.
  data: KpiData | null;
  refreshKey?: number;
  highlightChartId?: string | null;
};

function ChartCard({
  title,
  subtitle,
  children,
  span,
  highlight,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  span?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`card-surface card-hover p-5 ${span || ""} ${highlight ? "chart-highlight" : ""}`}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function ChartGrid({ data, refreshKey = 0, highlightChartId }: Props) {
  const [charts, setCharts] = useState<SpecChart[] | null>(null);

  useEffect(() => {
    let live = true;
    fetchDashboardSpec().then((s) => {
      if (live) setCharts(s.charts);
    });
    return () => {
      live = false;
    };
  }, [refreshKey]);

  if (!data || !charts) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-up">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card-surface p-5 h-[300px] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-up">
      {charts.map((c, i) => {
        // The first and third "wide" rendering positions span 2 cols when there are
        // pairs available — preserve the existing visual rhythm where possible.
        const span = i % 3 === 0 ? "lg:col-span-2" : "";
        return (
          <ChartCard
            key={c.spec.id}
            title={c.spec.title}
            subtitle={c.spec.subtitle}
            span={span}
            highlight={c.spec.id === highlightChartId}
          >
            <ChartRenderer spec={c.spec} rows={c.rows} height={240} />
          </ChartCard>
        );
      })}
    </div>
  );
}
