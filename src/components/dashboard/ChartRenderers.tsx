import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList,
} from "recharts";
import { useTheme } from "@/lib/theme";
import { paletteFor } from "@/lib/colors";
import type { ChartSpec } from "@/lib/mock-api";

type RendererProps = { spec: ChartSpec; rows: any[]; height?: number };

function formatMonth(m: string) {
  if (!/^\d{4}-\d{2}/.test(String(m))) return String(m);
  const [y, mo] = String(m).split("-");
  return new Date(parseInt(y), parseInt(mo) - 1, 1).toLocaleString("en", { month: "short" });
}
function formatK(n: number) {
  if (n >= 1000) return `$${Math.round(n / 1000)}k`;
  return `${n}`;
}

function useTokens() {
  const { theme } = useTheme();
  const p = paletteFor(theme);
  return {
    p,
    theme,
    tooltipStyle: {
      background: p.tooltipBg,
      border: `1px solid ${p.tooltipBorder}`,
      borderRadius: 10,
      fontSize: 12,
      padding: "8px 10px",
      backdropFilter: "blur(8px)",
      color: p.labelText,
    },
  };
}

function colorFor(spec: ChartSpec, p: ReturnType<typeof paletteFor>) {
  switch (spec.color) {
    case "sky": return p.sky;
    case "emerald": return p.emerald;
    case "amber": return p.amber;
    case "rose": return p.rose;
    case "violet":
    default: return p.violet;
  }
}

export function AreaChartRenderer({ spec, rows, height = 240 }: RendererProps) {
  const { p, tooltipStyle, theme } = useTokens();
  const c = colorFor(spec, p);
  const x = spec.xKey ?? "x";
  const y = spec.yKey ?? "value";
  const isMoney = /revenue|amount|spend|cost|invoice/i.test(y);
  const id = `area-${spec.id}`;
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <AreaChart data={rows} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c} stopOpacity={theme === "light" ? 0.4 : 0.5} />
              <stop offset="100%" stopColor={c} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey={x} tickFormatter={formatMonth} stroke={p.axis} fontSize={11} tickLine={false} axisLine={{ stroke: p.grid }} />
          <YAxis tickFormatter={(v: any) => (isMoney ? `$${(Number(v) / 1000).toFixed(0)}k` : String(v))} stroke={p.axis} fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(m: any) => formatMonth(String(m))}
            formatter={(v: any) => [isMoney ? `$${Number(v).toLocaleString()}` : String(v), y]}
          />
          <Area type="monotone" dataKey={y} stroke={p.violetGlow} strokeWidth={2} fill={`url(#${id})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarChartRenderer({ spec, rows, height = 240 }: RendererProps) {
  const { p, tooltipStyle } = useTokens();
  const c = colorFor(spec, p);
  const x = spec.xKey ?? "name";
  const y = spec.yKey ?? "value";
  const angled = rows.length > 4 && typeof rows[0]?.[x] === "string" && rows[0]?.[x].length > 4 && !/^\d{4}-\d{2}/.test(rows[0]?.[x]);
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 18, right: 10, left: -20, bottom: angled ? 30 : 0 }}>
          <XAxis
            dataKey={x}
            tickFormatter={formatMonth}
            stroke={p.axis}
            fontSize={angled ? 10 : 11}
            tickLine={false}
            axisLine={{ stroke: p.grid }}
            angle={angled ? -25 : 0}
            textAnchor={angled ? "end" : "middle"}
            height={angled ? 60 : 30}
            interval={0}
          />
          <YAxis stroke={p.axis} fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} labelFormatter={(m: any) => formatMonth(String(m))} />
          <Bar dataKey={y} fill={c} radius={[6, 6, 0, 0]} barSize={28}>
            <LabelList dataKey={y} position="top" style={{ fill: p.labelText, fontSize: 11 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarHorizontalRenderer({ spec, rows, height = 240 }: RendererProps) {
  const { p, tooltipStyle } = useTokens();
  const c = colorFor(spec, p);
  const name = spec.nameKey ?? "name";
  const value = spec.valueKey ?? "value";
  const isMoney = /revenue|amount|spend|value/i.test(value);
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <BarChart data={rows} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey={name} stroke={p.axis} fontSize={11} tickLine={false} axisLine={false} width={140} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [isMoney ? `$${Number(v).toLocaleString()}` : String(v), value]} />
          <Bar dataKey={value} fill={c} radius={[0, 6, 6, 0]} barSize={14}>
            <LabelList dataKey={value} position="right" formatter={(isMoney ? formatK : ((v: any) => String(v))) as any} style={{ fill: p.labelText, fontSize: 11 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const STATUS_COLOR_KEYS = ["Completed", "In Progress", "Received", "On Hold", "Cancelled"];
export function DonutRenderer({ spec, rows, height = 240 }: RendererProps) {
  const { p, tooltipStyle } = useTokens();
  const name = spec.nameKey ?? "name";
  const value = spec.valueKey ?? "value";
  const palette = [p.emerald, p.sky, p.violet, p.amber, p.rose];
  const colorOf = (n: string, i: number) => {
    const idx = STATUS_COLOR_KEYS.indexOf(n);
    return idx >= 0 ? palette[idx] : palette[i % palette.length];
  };
  return (
    <div className="h-full flex flex-col" style={{ height }}>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={rows} dataKey={value} nameKey={name} innerRadius={48} outerRadius={78} paddingAngle={2} stroke="none">
              {rows.map((r, i) => (
                <Cell key={String(r[name])} fill={colorOf(String(r[name]), i)} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs mt-2">
        {rows.map((r, i) => (
          <div key={String(r[name])} className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm" style={{ background: colorOf(String(r[name]), i) }} />
            <span className="text-muted-foreground truncate">{String(r[name])}</span>
            <span className="ml-auto tabular font-medium">{String(r[value])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StackedHorizontalRenderer({ spec, rows, height = 240 }: RendererProps) {
  const { p, tooltipStyle } = useTokens();
  const name = spec.nameKey ?? "name";
  const stackKeys = spec.stackKeys ?? ["active", "completed"];
  const colors = [p.amber, p.emerald, p.sky, p.violet, p.rose];
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <BarChart data={rows} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <XAxis type="number" stroke={p.axis} fontSize={11} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey={name} stroke={p.axis} fontSize={11} tickLine={false} axisLine={false} width={70} />
          <Tooltip contentStyle={tooltipStyle} />
          {stackKeys.map((k, i) => (
            <Bar
              key={k}
              dataKey={k}
              stackId="w"
              fill={colors[i % colors.length]}
              radius={i === stackKeys.length - 1 ? [0, 6, 6, 0] : [0, 0, 0, 0]}
              barSize={12}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChartRenderer(props: RendererProps) {
  switch (props.spec.type) {
    case "area": return <AreaChartRenderer {...props} />;
    case "bar": return <BarChartRenderer {...props} />;
    case "bar_horizontal": return <BarHorizontalRenderer {...props} />;
    case "bar_stacked_horizontal": return <StackedHorizontalRenderer {...props} />;
    case "donut": return <DonutRenderer {...props} />;
    default: return null;
  }
}
