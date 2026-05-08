import type { KpiData } from "@/lib/mock-api";
import { useTheme } from "@/lib/theme";
import { paletteFor, tintFor } from "@/lib/colors";

function fmtShort(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString("en", { month: "short", day: "numeric" });
}

function withAlpha(oklchColor: string, alpha: number): string {
  // oklch(L C H) -> oklch(L C H / alpha)
  const inside = oklchColor.replace(/^oklch\(|\)$/g, "");
  return `oklch(${inside} / ${alpha})`;
}

export function DataTables({ data }: { data: KpiData | null }) {
  const { theme } = useTheme();
  const p = paletteFor(theme);
  const tint = tintFor(theme);

  const STATUS_BG: Record<string, string> = {
    Completed: withAlpha(p.emerald, tint),
    "In Progress": withAlpha(p.sky, tint),
    Received: withAlpha(p.violet, tint),
    "On Hold": withAlpha(p.amber, tint),
    Cancelled: withAlpha(p.rose, tint),
  };
  const STATUS_FG: Record<string, string> = {
    Completed: p.emerald,
    "In Progress": p.sky,
    Received: p.violetGlow,
    "On Hold": p.amber,
    Cancelled: p.rose,
  };
  const PRIO_BG: Record<string, string> = {
    Rush: withAlpha(p.rose, tint),
    High: withAlpha(p.amber, tint),
    Normal: theme === "light" ? "oklch(0.92 0.008 280)" : "oklch(1 0 0 / 0.06)",
    Low: withAlpha(p.sky, tint),
  };
  const PRIO_FG: Record<string, string> = {
    Rush: p.rose,
    High: p.amber,
    Normal: p.labelText,
    Low: p.sky,
  };

  function dueChip(dateStr: string) {
    const due = new Date(dateStr);
    const now = new Date();
    const days = Math.round((due.getTime() - now.getTime()) / 86400000);
    let label: string, bg: string, fg: string;
    if (days < 0) {
      label = `${Math.abs(days)}d overdue`;
      bg = withAlpha(p.rose, tint); fg = p.rose;
    } else if (days === 0) {
      label = "today"; bg = withAlpha(p.amber, tint + 0.02); fg = p.amber;
    } else if (days <= 14) {
      label = `${days}d`; bg = withAlpha(p.amber, tint); fg = p.amber;
    } else {
      label = `${days}d`; bg = withAlpha(p.sky, tint - 0.03); fg = p.sky;
    }
    return <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium tabular" style={{ background: bg, color: fg }}>{label}</span>;
  }

  function pill(value: string, bg: Record<string, string>, fg: Record<string, string>) {
    return (
      <span
        className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium"
        style={{ background: bg[value] || "var(--input-bg)", color: fg[value] || "var(--text)" }}
      >
        {value}
      </span>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 animate-fade-up">
      <div className="card-surface card-hover p-5">
        <h3 className="text-sm font-semibold tracking-tight mb-4">Recent jobs</h3>
        {!data?.tables.recentJobs.length ? (
          <Empty msg="No jobs." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground uppercase text-[10px] tracking-wider">
                  <th className="py-2 pr-3 font-medium">Job #</th>
                  <th className="py-2 pr-3 font-medium">Customer</th>
                  <th className="py-2 pr-3 font-medium">Tech</th>
                  <th className="py-2 pr-3 font-medium">Priority</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Received</th>
                  <th className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.tables.recentJobs.map((j) => (
                  <tr key={j.JobNumber} className="border-t border-border row-hover transition-colors">
                    <td className="py-2.5 pr-3 mono" style={{ color: p.violetGlow }}>{j.JobNumber}</td>
                    <td className="py-2.5 pr-3 truncate max-w-[160px]">{j.Customer}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{j.Technician}</td>
                    <td className="py-2.5 pr-3">{pill(j.Priority, PRIO_BG, PRIO_FG)}</td>
                    <td className="py-2.5 pr-3">{pill(j.Status, STATUS_BG, STATUS_FG)}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground tabular">{fmtShort(j.ReceivedDate)}</td>
                    <td className="py-2.5 text-right tabular font-medium">${j.TotalAmount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card-surface card-hover p-5">
        <h3 className="text-sm font-semibold tracking-tight mb-4">Calibrations due soon</h3>
        {!data?.tables.dueSoon.length ? (
          <Empty msg="Nothing due in window." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground uppercase text-[10px] tracking-wider">
                  <th className="py-2 pr-3 font-medium">Customer</th>
                  <th className="py-2 pr-3 font-medium">Equipment</th>
                  <th className="py-2 pr-3 font-medium">Serial</th>
                  <th className="py-2 text-right font-medium">Due</th>
                </tr>
              </thead>
              <tbody>
                {data.tables.dueSoon.map((e, i) => (
                  <tr key={i} className="border-t border-border row-hover transition-colors">
                    <td className="py-2.5 pr-3 truncate max-w-[160px]">{e.Customer}</td>
                    <td className="py-2.5 pr-3">
                      <div>{e.EquipmentType}</div>
                      <div className="text-muted-foreground text-[10px]">{e.Manufacturer} · {e.Model}</div>
                    </td>
                    <td className="py-2.5 pr-3 mono text-muted-foreground">{e.SerialNumber}</td>
                    <td className="py-2.5 text-right">{dueChip(e.NextCalibrationDue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="py-10 text-center text-sm text-muted-foreground">{msg}</div>;
}
