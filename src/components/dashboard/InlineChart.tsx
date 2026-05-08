import type { ChartSpec } from "@/lib/mock-api";
import { ChartRenderer } from "./ChartRenderers";

type Props = {
  spec: ChartSpec;
  rows: any[];
  height?: number;
};

export function InlineChart({ spec, rows, height = 280 }: Props) {
  const empty = !rows || rows.length === 0;
  return (
    <div
      className="rounded-lg border border-border p-3 animate-fade-up"
      style={{ background: "var(--input-bg)" }}
    >
      <div className="mb-2">
        <h4 className="text-[13px] font-semibold tracking-tight">{spec.title}</h4>
        {spec.subtitle && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{spec.subtitle}</p>
        )}
      </div>
      {empty ? (
        <div
          className="flex items-center justify-center text-xs text-muted-foreground"
          style={{ height }}
        >
          No data for this query in the current dataset.
        </div>
      ) : (
        <ChartRenderer spec={spec} rows={rows} height={height} />
      )}
    </div>
  );
}
