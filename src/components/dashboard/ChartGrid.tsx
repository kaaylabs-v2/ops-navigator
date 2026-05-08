import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList,
} from "recharts";
import type { KpiData } from "@/lib/mock-api";
import { useTheme } from "@/lib/theme";
import { paletteFor } from "@/lib/colors";

function formatMonth(m: string) {
  const [y, mo] = m.split("-");
  return new Date(parseInt(y), parseInt(mo) - 1, 1).toLocaleString("en", { month: "short" });
}
function formatK(n: number) { return `$${Math.round(n / 1000)}k`; }

function ChartCard({ title, subtitle, children, span }: {
  title: string; subtitle?: string; children: React.ReactNode; span?: string;
}) {
  return (
    <div className={`card-surface card-hover p-5 ${span || ""}`}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="h-[240px]">{children}</div>
    </div>
  );
}

export function ChartGrid({ data }: { data: KpiData | null }) {
  const { theme } = useTheme();
  const p = paletteFor(theme);

  const STATUS_COLORS: Record<string, string> = {
    Completed: p.emerald,
    "In Progress": p.sky,
    Received: p.violet,
    "On Hold": p.amber,
    Cancelled: p.rose,
  };

  const tooltipStyle = {
    background: p.tooltipBg,
    border: `1px solid ${p.tooltipBorder}`,
    borderRadius: 10,
    fontSize: 12,
    padding: "8px 10px",
    backdropFilter: "blur(8px)",
    color: p.labelText,
  };

  if (!data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-up">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card-surface p-5 h-[300px] animate-pulse" />
        ))}
      </div>
    );
  }
  const c = data.charts;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-up">
      <ChartCard title="Revenue last 12 months" subtitle="Monthly invoiced revenue" span="lg:col-span-2">
        <ResponsiveContainer>
          <AreaChart data={c.revenueByMonth} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={p.violet} stopOpacity={theme === "light" ? 0.4 : 0.5} />
                <stop offset="100%" stopColor={p.violet} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tickFormatter={formatMonth} stroke={p.axis} fontSize={11} tickLine={false} axisLine={{ stroke: p.grid }} />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} stroke={p.axis} fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(m: any) => formatMonth(String(m))}
              formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Revenue"]}
            />
            <Area type="monotone" dataKey="revenue" stroke={p.violetGlow} strokeWidth={2} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Jobs by status" subtitle="All open & recent jobs">
        <div className="h-full flex flex-col">
          <div className="flex-1 min-h-0">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={c.jobsByStatus} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2} stroke="none">
                  {c.jobsByStatus.map((s) => (
                    <Cell key={s.name} fill={STATUS_COLORS[s.name] || p.violet} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            {c.jobsByStatus.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span className="size-2 rounded-sm" style={{ background: STATUS_COLORS[s.name] || p.violet }} />
                <span className="text-muted-foreground truncate">{s.name}</span>
                <span className="ml-auto tabular font-medium">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </ChartCard>

      <ChartCard title="Top customers" subtitle="Last 12 months revenue · top 10" span="lg:col-span-2">
        <ResponsiveContainer>
          <BarChart data={c.topCustomers} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" stroke={p.axis} fontSize={11} tickLine={false} axisLine={false} width={140} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Revenue"]} />
            <Bar dataKey="value" fill={p.violet} radius={[0, 6, 6, 0]} barSize={14}>
              <LabelList dataKey="value" position="right" formatter={formatK as any} style={{ fill: p.labelText, fontSize: 11 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Calibrations due" subtitle="Next 6 months">
        <ResponsiveContainer>
          <BarChart data={c.calibrationsDueByMonth} margin={{ top: 18, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="month" tickFormatter={formatMonth} stroke={p.axis} fontSize={11} tickLine={false} axisLine={{ stroke: p.grid }} />
            <YAxis stroke={p.axis} fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={(m: any) => formatMonth(String(m))} />
            <Bar dataKey="due" fill={p.sky} radius={[6, 6, 0, 0]} barSize={28}>
              <LabelList dataKey="due" position="top" style={{ fill: p.labelText, fontSize: 11 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Equipment by type" subtitle="Active inventory" span="lg:col-span-2">
        <ResponsiveContainer>
          <BarChart data={c.equipmentByType} margin={{ top: 5, right: 10, left: -20, bottom: 30 }}>
            <XAxis dataKey="name" stroke={p.axis} fontSize={10} tickLine={false} axisLine={{ stroke: p.grid }} angle={-25} textAnchor="end" height={60} interval={0} />
            <YAxis stroke={p.axis} fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill={p.violetGlow} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Technician workload" subtitle="Active vs completed">
        <ResponsiveContainer>
          <BarChart data={c.technicianWorkload} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <XAxis type="number" stroke={p.axis} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" stroke={p.axis} fontSize={11} tickLine={false} axisLine={false} width={70} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="active" stackId="w" fill={p.amber} radius={[0, 0, 0, 0]} barSize={12} />
            <Bar dataKey="completed" stackId="w" fill={p.emerald} radius={[0, 6, 6, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
