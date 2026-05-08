import { useState } from "react";
import { X, ArrowRight } from "lucide-react";
import type { ChartSpec } from "@/lib/mock-api";
import { ChartRenderer } from "./ChartRenderers";

type ChartItem = { spec: ChartSpec; rows: any[] };

type Props = {
  open: boolean;
  newChart: ChartItem | null;
  existingCharts: ChartItem[];
  onCancel: () => void;
  onConfirm: (replaceChartId: string) => Promise<void>;
};

export function MakeRoomModal({ open, newChart, existingCharts, onCancel, onConfirm }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (!open || !newChart) return null;

  const target = existingCharts.find((c) => c.spec.id === selected) ?? null;

  async function handleConfirm() {
    if (!selected) return;
    setConfirming(true);
    try {
      await onConfirm(selected);
      setSelected(null);
    } finally {
      setConfirming(false);
    }
  }

  function handleCancel() {
    setSelected(null);
    onCancel();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fade-up"
      style={{ background: "var(--modal-backdrop)", backdropFilter: "blur(8px)" }}
      onClick={handleCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card-surface w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden relative"
        style={{ background: "var(--surface-solid)" }}
      >
        <div className="flex items-start justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold tracking-tight">Choose a chart to replace</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your dashboard is already full. Pick one to swap with the new “{newChart.spec.title}”.
            </p>
          </div>
          <button onClick={handleCancel} className="p-1.5 rounded-md hover:bg-[var(--row-hover)]">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* New chart preview */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2"
              style={{ color: "var(--ai-mark-fg)" }}>
              New chart · this will replace whichever you pick
            </div>
            <div
              className="rounded-lg border p-4"
              style={{
                borderColor: "color-mix(in oklch, var(--violet) 35%, transparent)",
                background: "var(--input-bg)",
              }}
            >
              <h3 className="text-sm font-semibold tracking-tight mb-1">{newChart.spec.title}</h3>
              {newChart.spec.subtitle && (
                <p className="text-xs text-muted-foreground mb-3">{newChart.spec.subtitle}</p>
              )}
              <ChartRenderer spec={newChart.spec} rows={newChart.rows} height={180} />
            </div>
          </div>

          {/* Existing thumbnails */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
              Existing charts
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {existingCharts.map((c, i) => {
                const isSelected = selected === c.spec.id;
                const dimmed = selected !== null && !isSelected;
                return (
                  <button
                    key={c.spec.id}
                    type="button"
                    onClick={() => setSelected(c.spec.id)}
                    aria-pressed={isSelected}
                    className="group text-left rounded-lg border p-3 transition-all duration-200 focus:outline-none animate-slide-in-y"
                    style={{
                      animationDelay: `${i * 50}ms`,
                      borderColor: isSelected
                        ? "var(--violet)"
                        : "var(--border)",
                      background: "var(--input-bg)",
                      transform: isSelected ? "scale(1.02)" : "scale(1)",
                      opacity: dimmed ? 0.6 : 1,
                      boxShadow: isSelected
                        ? "0 0 0 2px color-mix(in oklch, var(--violet) 35%, transparent)"
                        : undefined,
                    }}
                  >
                    <div className="h-[110px] overflow-hidden">
                      <ChartRenderer spec={c.spec} rows={c.rows} height={110} />
                    </div>
                    <div className="mt-2 text-xs font-medium tracking-tight truncate">
                      {c.spec.title}
                    </div>
                    {c.spec.subtitle && (
                      <div className="text-[10px] text-muted-foreground truncate">
                        {c.spec.subtitle}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Inline confirmation overlay */}
        {target && (
          <div
            className="absolute inset-x-0 bottom-0 px-6 py-4 border-t border-border animate-slide-in-y"
            style={{ background: "var(--surface-solid)" }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm flex items-center gap-2 flex-wrap">
                <span className="text-muted-foreground">Replace</span>
                <span className="font-semibold">{target.spec.title}</span>
                <ArrowRight className="size-3.5 text-muted-foreground" />
                <span className="font-semibold" style={{ color: "var(--ai-mark-fg)" }}>
                  {newChart.spec.title}
                </span>
                <span className="text-muted-foreground">?</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelected(null)}
                  disabled={confirming}
                  className="px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-[var(--row-hover)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="px-4 py-2 text-xs font-medium rounded-lg disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, var(--violet), var(--violet-glow))",
                    color: "white",
                  }}
                >
                  {confirming ? "Replacing…" : "Confirm replace"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
