import type { KpiData } from "@/lib/mock-api";

const STATUS_BG: Record<string, string> = {
  Completed: "oklch(0.72 0.18 155 / 0.18)",
  "In Progress": "oklch(0.72 0.14 235 / 0.18)",
  Received: "oklch(0.66 0.22 290 / 0.18)",
  "On Hold": "oklch(0.78 0.16 75 / 0.18)",
  Cancelled: "oklch(0.66 0.22 18 / 0.18)",
};
const STATUS_FG: Record<string, string> = {
  Completed: "var(--emerald)",
  "In Progress": "var(--sky)",
  Received: "var(--violet-glow)",
  "On Hold": "var(--amber)",
  Cancelled: "var(--rose)",
};
const PRIO_BG: Record<string, string> = {
  Rush: "oklch(0.66 0.22 18 / 0.18)",
  High: "oklch(0.78 0.16 75 / 0.18)",
  Normal: "oklch(1 0 0 / 0.06)",
  Low: "oklch(0.72 0.14 235 / 0.18)",
};
const PRIO_FG: Record<string, string> = {
  Rush: "var(--rose)",
  High: "var(--amber)",
  Normal: "oklch(0.85 0.01 280)",
  Low: "var(--sky)",
};

function fmtShort(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString("en", { month: "short", day: "numeric" });
}

function dueChip(dateStr: string) {
  const due = new Date(dateStr);
  const now = new Date();
  const days = Math.round((due.getTime() - now.getTime()) / 86400000);
  let label: string, bg: string, fg: string;
  if (days < 0) {
    label = `${Math.abs(days)}d overdue`;
    bg = "oklch(0.66 0.22 18 / 0.18)"; fg = "var(--rose)";
  } else if (days === 0) {
    label = "today"; bg = "oklch(0.78 0.16 75 / 0.2)"; fg = "var(--amber)";
  } else if (days <= 14) {
    label = `${days}d`; bg = "oklch(0.78 0.16 75 / 0.18)"; fg = "var(--amber)";
  } else {
    label = `${days}d`; bg = "oklch(0.72 0.14 235 / 0.15)"; fg = "var(--sky)";
  }
  return <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium tabular" style={{ background: bg, color: fg }}>{label}</span>;
}

function pill(value: string, bg: Record<string,string>, fg: Record<string,string>) {
  return (
    <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium"
      style={{ background: bg[value] || "oklch(1 0 0 / 0.06)", color: fg[value] || "var(--foreground)" }}>
      {value}
    </span>
  );
}

export function DataTables({ data }: { data: KpiData | null }) {
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
                  <tr key={j.JobNumber} className="border-t border-white/5 row-hover transition-colors">
                    <td className="py-2.5 pr-3 mono" style={{ color: "var(--violet-glow)" }}>{j.JobNumber}</td>
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
                  <tr key={i} className="border-t border-white/5 row-hover transition-colors">
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
