// Mock API for the JM Test dashboard. Returns data shaped exactly like the
// real backend at http://localhost:4000. Wire to real fetch later by swapping
// fetchKpis / fetchInsights / fetchSettings / sendChat with real /api/* calls.

export type Settings = {
  dbMode: "mock" | "mssql";
  aiMode: "claude" | "nexus";
  mssql: {
    host: string;
    port: number;
    user: string;
    database: string;
    encrypt: boolean;
    trustServerCertificate: boolean;
    hasPassword: boolean;
  };
  claude: { model: string; hasApiKey: boolean };
  nexus: { url: string; source: string; tenantUid: string; botUid: string };
};

export type KpiData = {
  kpis: {
    activeJobs: number;
    completedMtd: number;
    avgTurnaroundDays: number;
    dueSoon30: number;
    revenueMtd: number;
    outstandingAr: number;
    onTimePct: number;
    overdueJobs: number;
  };
  charts: {
    jobsByStatus: { name: string; value: number }[];
    revenueByMonth: { month: string; revenue: number }[];
    topCustomers: { name: string; value: number }[];
    calibrationsDueByMonth: { month: string; due: number }[];
    equipmentByType: { name: string; value: number }[];
    technicianWorkload: { name: string; active: number; completed: number }[];
  };
  tables: {
    recentJobs: {
      JobNumber: string;
      Customer: string;
      Technician: string;
      Status: string;
      Priority: string;
      ReceivedDate: string;
      DueDate: string;
      TotalAmount: number;
    }[];
    dueSoon: {
      Customer: string;
      EquipmentType: string;
      Manufacturer: string;
      Model: string;
      SerialNumber: string;
      NextCalibrationDue: string;
    }[];
  };
  meta: { dialect: string; dbMode: string; generatedAt: string };
};

export type InsightCard = {
  severity: "critical" | "warning" | "info" | "positive";
  icon:
    | "alert-triangle"
    | "clock"
    | "calendar"
    | "trending-up"
    | "wallet"
    | "target"
    | "user";
  title: string;
  body: string;
};

export type Insights = {
  headline: string | null;
  cards: InsightCard[];
};

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type ChatAudit = {
  tool: "execute_sql" | "get_schema" | "nexus.sql";
  input: { sql?: string };
  ok: boolean;
  summary: string;
};
export type ChatResponse = {
  reply: string;
  mode: "claude" | "nexus";
  audit: ChatAudit[];
};

let settingsState: Settings = {
  dbMode: "mock",
  aiMode: "claude",
  mssql: {
    host: "",
    port: 1433,
    user: "",
    database: "JMTest",
    encrypt: true,
    trustServerCertificate: false,
    hasPassword: false,
  },
  claude: { model: "claude-sonnet-4-5", hasApiKey: true },
  nexus: {
    url: "https://nexus.apps.kaaylabs.com/chatbot/api/v1/gateway/conversation/query",
    source: "jm-test-dashboard",
    tenantUid: "",
    botUid: "",
  },
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchSettings(): Promise<Settings> {
  await delay(120);
  return JSON.parse(JSON.stringify(settingsState));
}

export async function patchSettings(patch: Partial<Settings> & {
  mssql?: Partial<Settings["mssql"]> & { password?: string };
  claude?: Partial<Settings["claude"]> & { apiKey?: string };
  nexus?: Partial<Settings["nexus"]>;
}): Promise<Settings> {
  await delay(160);
  settingsState = {
    ...settingsState,
    ...patch,
    mssql: { ...settingsState.mssql, ...(patch.mssql || {}),
      hasPassword: patch.mssql?.password ? true : settingsState.mssql.hasPassword },
    claude: { ...settingsState.claude, ...(patch.claude || {}),
      hasApiKey: patch.claude?.apiKey ? true : settingsState.claude.hasApiKey },
    nexus: { ...settingsState.nexus, ...(patch.nexus || {}) },
  };
  // strip secrets
  delete (settingsState.mssql as any).password;
  delete (settingsState.claude as any).apiKey;
  return JSON.parse(JSON.stringify(settingsState));
}

export async function testConnection(_cfg: any): Promise<{ ok: boolean; version?: string; error?: string }> {
  await delay(900);
  if (!_cfg?.host) return { ok: false, error: "host is required" };
  return { ok: true, version: "Microsoft SQL Server 2022 (RTM-CU10)" };
}

// ---- Realistic seed data ----
const customers = [
  "Boeing Wichita", "Lockheed Martin Aero", "Northrop Grumman", "Raytheon Tucson",
  "GE Aerospace", "Pratt & Whitney", "Spirit AeroSystems", "Collins Aerospace",
  "Honeywell Phoenix", "Textron Aviation", "Bell Flight", "Sikorsky",
  "ExxonMobil Baytown", "Chevron Pasadena", "Phillips 66", "Marathon Petroleum",
  "Occidental Permian", "Halliburton", "Schlumberger", "Baker Hughes",
  "Pfizer Kalamazoo", "Merck Rahway", "Eli Lilly", "AbbVie", "Amgen Thousand Oaks",
  "Moderna", "Bristol-Myers Squibb", "Novartis Sandoz",
  "Tesla Austin", "Ford Dearborn", "GM Lansing", "Toyota Georgetown",
  "Caterpillar Peoria", "John Deere Moline", "Rockwell Automation", "Emerson Electric",
  "Siemens Industry", "ABB Inc.", "Eaton Corporation", "Parker Hannifin",
];

const technicians = [
  "M. Alvarez", "T. Nguyen", "K. Patel", "S. Brennan",
  "J. Okafor", "R. Yamamoto", "L. Petrov", "D. Schultz",
];

const equipmentTypes = [
  "Pressure Gauge", "Torque Wrench", "Multimeter", "Oscilloscope",
  "Caliper", "Micrometer", "Thermocouple", "Flow Meter",
  "Mass Standard", "Force Transducer",
];

const statuses = ["Completed", "In Progress", "Received", "On Hold", "Cancelled"];
const priorities = ["Rush", "High", "Normal", "Low"];

// deterministic PRNG
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function shortMonth(d: Date) {
  return d.toISOString().slice(0, 7);
}

function buildKpis(): KpiData {
  const now = new Date();

  // revenue last 12 months
  const revenueByMonth: { month: string; revenue: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const base = 145000 + rand() * 80000;
    const seasonal = Math.sin((d.getMonth() / 12) * Math.PI * 2) * 22000;
    revenueByMonth.push({ month: shortMonth(d), revenue: Math.round(base + seasonal) });
  }

  const topCustomers = customers
    .slice(0, 14)
    .map((name) => ({ name, value: Math.round(40000 + rand() * 280000) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const calibrationsDueByMonth: { month: string; due: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    calibrationsDueByMonth.push({
      month: shortMonth(d),
      due: Math.round(34 + rand() * 48),
    });
  }

  const equipmentByType = equipmentTypes
    .map((name) => ({ name, value: Math.round(18 + rand() * 56) }))
    .sort((a, b) => b.value - a.value);

  const technicianWorkload = technicians.map((name) => ({
    name,
    active: Math.round(4 + rand() * 14),
    completed: Math.round(28 + rand() * 60),
  }));

  const jobsByStatus = [
    { name: "Completed", value: 412 },
    { name: "In Progress", value: 87 },
    { name: "Received", value: 54 },
    { name: "On Hold", value: 12 },
    { name: "Cancelled", value: 9 },
  ];

  const recentJobs = Array.from({ length: 12 }).map((_, i) => {
    const received = new Date(now.getTime() - (i * 1.5 + rand() * 3) * 86400000);
    const due = new Date(received.getTime() + (5 + Math.floor(rand() * 14)) * 86400000);
    return {
      JobNumber: `JM-${(25431 - i).toString()}`,
      Customer: pick(customers),
      Technician: pick(technicians),
      Status: rand() < 0.55 ? "Completed" : pick(statuses),
      Priority: rand() < 0.1 ? "Rush" : pick(priorities),
      ReceivedDate: fmtDate(received),
      DueDate: fmtDate(due),
      TotalAmount: Math.round(420 + rand() * 4800),
    };
  });

  const dueSoon = Array.from({ length: 12 }).map(() => {
    const offset = Math.floor(rand() * 45) - 8;
    const due = new Date(now.getTime() + offset * 86400000);
    const eq = pick(equipmentTypes);
    return {
      Customer: pick(customers),
      EquipmentType: eq,
      Manufacturer: pick(["Fluke", "Mitutoyo", "Keysight", "Snap-on", "Yokogawa", "Endress+Hauser"]),
      Model: `${pick(["MX", "PR", "DT", "QC"])}-${Math.floor(rand() * 9000 + 1000)}`,
      SerialNumber: `SN${Math.floor(rand() * 900000 + 100000)}`,
      NextCalibrationDue: fmtDate(due),
    };
  }).sort((a, b) => a.NextCalibrationDue.localeCompare(b.NextCalibrationDue));

  return {
    kpis: {
      activeJobs: 87,
      completedMtd: 134,
      avgTurnaroundDays: 6.4,
      dueSoon30: 142,
      revenueMtd: revenueByMonth[revenueByMonth.length - 1].revenue,
      outstandingAr: 268450,
      onTimePct: 91.2,
      overdueJobs: 7,
    },
    charts: {
      jobsByStatus,
      revenueByMonth,
      topCustomers,
      calibrationsDueByMonth,
      equipmentByType,
      technicianWorkload,
    },
    tables: { recentJobs, dueSoon },
    meta: {
      dialect: settingsState.dbMode === "mock" ? "sqlite" : "tsql",
      dbMode: settingsState.dbMode,
      generatedAt: new Date().toISOString(),
    },
  };
}

export async function fetchKpis(): Promise<KpiData> {
  await delay(420);
  return buildKpis();
}

export async function fetchInsights(): Promise<Insights> {
  await delay(680);
  return {
    headline: "Calibration backlog grew 18% this week — three technicians are overloaded.",
    cards: [
      {
        severity: "critical",
        icon: "alert-triangle",
        title: "7 jobs past due",
        body: "Boeing Wichita and Pratt & Whitney account for 4 of 7. Median slip is 3 days.",
      },
      {
        severity: "warning",
        icon: "calendar",
        title: "142 calibrations due in 30 days",
        body: "Pharma cluster (Pfizer, Merck, Lilly) drives 38% of this window.",
      },
      {
        severity: "warning",
        icon: "user",
        title: "T. Nguyen at 17 active jobs",
        body: "2.4× the team median. Consider rebalancing rush work to S. Brennan.",
      },
      {
        severity: "positive",
        icon: "target",
        title: "On-time at 91.2%",
        body: "Above the 90% SLA threshold for the 5th week in a row.",
      },
      {
        severity: "info",
        icon: "trending-up",
        title: "Revenue MTD pacing +12% MoM",
        body: "Aerospace segment leading with 4 new POs from Lockheed and GE.",
      },
      {
        severity: "warning",
        icon: "wallet",
        title: "$268k A/R outstanding",
        body: "$84k aged 60+ days, concentrated in two energy-sector accounts.",
      },
    ],
  };
}

// ---- Chat mock ----
export async function sendChat(messages: ChatMessage[]): Promise<ChatResponse> {
  await delay(900 + rand() * 700);
  const last = messages[messages.length - 1]?.content.toLowerCase() ?? "";
  const mode = settingsState.aiMode;

  if (last.includes("overdue")) {
    return {
      mode,
      reply:
        "There are **7 jobs past their DueDate** right now. The worst offender is JM-25408 (Boeing Wichita) at 6 days late — a Rush-priority torque wrench cluster assigned to T. Nguyen. The other 6 are within 1–3 days late and trend toward pharma customers.",
      audit: [
        {
          tool: "execute_sql",
          input: {
            sql: "SELECT COUNT(*) AS overdue\nFROM Jobs\nWHERE Status NOT IN ('Completed','Cancelled')\n  AND DueDate < CAST(GETDATE() AS date);",
          },
          ok: true,
          summary: "1 row",
        },
        {
          tool: "execute_sql",
          input: {
            sql: "SELECT TOP 10 j.JobNumber, c.Name AS Customer, t.Name AS Technician,\n       DATEDIFF(day, j.DueDate, GETDATE()) AS DaysLate, j.Priority\nFROM Jobs j\nJOIN Customers c ON c.Id = j.CustomerId\nJOIN Technicians t ON t.Id = j.TechnicianId\nWHERE j.Status NOT IN ('Completed','Cancelled') AND j.DueDate < CAST(GETDATE() AS date)\nORDER BY DaysLate DESC;",
          },
          ok: true,
          summary: "7 rows",
        },
      ],
    };
  }
  if (last.includes("revenue") || last.includes("customer")) {
    return {
      mode,
      reply:
        "**Top 5 customers YTD by revenue:** Lockheed Martin Aero ($412k), GE Aerospace ($358k), Pfizer Kalamazoo ($301k), Boeing Wichita ($284k), and ExxonMobil Baytown ($241k). Aerospace alone is 47% of YTD revenue.",
      audit: [
        {
          tool: "execute_sql",
          input: {
            sql: "SELECT TOP 5 c.Name, SUM(i.Amount) AS Revenue\nFROM Invoices i\nJOIN Jobs j ON j.Id = i.JobId\nJOIN Customers c ON c.Id = j.CustomerId\nWHERE YEAR(i.IssuedDate) = YEAR(GETDATE())\nGROUP BY c.Name\nORDER BY Revenue DESC;",
          },
          ok: true,
          summary: "5 rows",
        },
      ],
    };
  }
  if (last.includes("calibration") || last.includes("due")) {
    return {
      mode,
      reply:
        "**63 calibrations are due next month.** The largest single owner is **Pfizer Kalamazoo with 11**, followed by Merck Rahway (8) and ExxonMobil Baytown (7). Pharma represents 41% of next-month volume.",
      audit: [
        {
          tool: "get_schema",
          input: {},
          ok: true,
          summary: "7 tables",
        },
        {
          tool: "execute_sql",
          input: {
            sql: "SELECT c.Name AS Customer, COUNT(*) AS DueCount\nFROM Equipment e\nJOIN Customers c ON c.Id = e.CustomerId\nWHERE e.NextCalibrationDue >= DATEADD(month, DATEDIFF(month,0,GETDATE())+1, 0)\n  AND e.NextCalibrationDue <  DATEADD(month, DATEDIFF(month,0,GETDATE())+2, 0)\nGROUP BY c.Name\nORDER BY DueCount DESC;",
          },
          ok: true,
          summary: "18 rows",
        },
      ],
    };
  }
  return {
    mode,
    reply:
      "I queried the database but didn't find a clean match for that question. Try asking about overdue jobs, top customers, calibrations due, or technician workload.",
    audit: [{ tool: "get_schema", input: {}, ok: true, summary: "7 tables" }],
  };
}

// ============================================================================
// Chart generation — slash-command driven artifact creation in the chat panel.
// Backend streams SSE; this mock simulates the same shape & cadence.
// ============================================================================

export type ChartType =
  | "area"
  | "bar"
  | "bar_horizontal"
  | "bar_stacked_horizontal"
  | "donut";

export type ChartSpec = {
  id: string;
  type: ChartType;
  title: string;
  subtitle?: string;
  // Field names within `rows` to read — kept simple for the mock.
  xKey?: string;
  yKey?: string;
  nameKey?: string;
  valueKey?: string;
  // For stacked: array of dataKeys
  stackKeys?: string[];
  // Color token: violet | sky | emerald | amber | rose
  color?: "violet" | "sky" | "emerald" | "amber" | "rose";
};

export type ChartGenEvent =
  | { event: "status"; data: { phase: "interpreting" | "drafting" | "running" | "validating" | "rendering"; message: string } }
  | { event: "ready"; data: { spec: ChartSpec; rows: any[]; rationale: string } }
  | { event: "suggestions"; data: { suggestions: string[] } }
  | { event: "error"; data: { message: string; phase?: string; draftTitle?: string } };

export type DashboardSpecResponse = { charts: { spec: ChartSpec; rows: any[] }[] };

// In-memory dashboard spec — starts with the existing 6 ChartGrid charts.
let dashboardSpec: { charts: { spec: ChartSpec; rows: any[] }[] } | null = null;

function ensureSpec(): DashboardSpecResponse {
  if (dashboardSpec) return dashboardSpec;
  const k = buildKpis();
  dashboardSpec = {
    charts: [
      { spec: { id: "rev-12mo", type: "area", title: "Revenue last 12 months", subtitle: "Monthly invoiced revenue", xKey: "month", yKey: "revenue", color: "violet" }, rows: k.charts.revenueByMonth },
      { spec: { id: "jobs-status", type: "donut", title: "Jobs by status", subtitle: "All open & recent jobs", nameKey: "name", valueKey: "value" }, rows: k.charts.jobsByStatus },
      { spec: { id: "top-cust", type: "bar_horizontal", title: "Top customers", subtitle: "Last 12 months · top 10", nameKey: "name", valueKey: "value", color: "violet" }, rows: k.charts.topCustomers },
      { spec: { id: "cal-due", type: "bar", title: "Calibrations due", subtitle: "Next 6 months", xKey: "month", yKey: "due", color: "sky" }, rows: k.charts.calibrationsDueByMonth },
      { spec: { id: "equip-type", type: "bar", title: "Equipment by type", subtitle: "Active inventory", xKey: "name", yKey: "value", color: "violet" }, rows: k.charts.equipmentByType },
      { spec: { id: "tech-workload", type: "bar_stacked_horizontal", title: "Technician workload", subtitle: "Active vs completed", nameKey: "name", stackKeys: ["active", "completed"] }, rows: k.charts.technicianWorkload },
    ],
  };
  return dashboardSpec;
}

export async function fetchDashboardSpec(): Promise<DashboardSpecResponse> {
  await delay(180);
  return JSON.parse(JSON.stringify(ensureSpec()));
}

export async function addChartToSpec(chart: { spec: ChartSpec; rows: any[] }): Promise<DashboardSpecResponse> {
  await delay(220);
  ensureSpec();
  dashboardSpec!.charts.push(chart);
  return JSON.parse(JSON.stringify(dashboardSpec));
}

export async function replaceChartInSpec(replaceId: string, chart: { spec: ChartSpec; rows: any[] }): Promise<DashboardSpecResponse> {
  await delay(220);
  ensureSpec();
  const i = dashboardSpec!.charts.findIndex((c) => c.spec.id === replaceId);
  if (i >= 0) dashboardSpec!.charts.splice(i, 1, chart);
  return JSON.parse(JSON.stringify(dashboardSpec));
}

// ---- Mock chart-generation interpreter ----------------------------------
function interpretPrompt(prompt: string): ChartGenEvent {
  const p = prompt.toLowerCase().trim();
  if (!p || /^(something|anything|cool|surprise)/.test(p) || p.length < 6) {
    return {
      event: "suggestions",
      data: {
        suggestions: [
          "Revenue by month",
          "Top 10 customers by spend",
          "Jobs by status",
        ],
      },
    };
  }
  if (/(mars|moon|earth|distance|weather|stock)/.test(p)) {
    return {
      event: "error",
      data: {
        message: "the SQL didn't work against the schema",
        phase: "validating",
        draftTitle: "Unrelated metric",
      },
    };
  }

  const k = buildKpis();
  const id = `gen-${Date.now().toString(36)}`;

  if (/revenue|invoice/.test(p) && /month|trend|time/.test(p)) {
    return {
      event: "ready",
      data: {
        spec: { id, type: "area", title: "Monthly revenue trend", subtitle: "Invoiced revenue, last 12 months", xKey: "month", yKey: "revenue", color: "violet" },
        rows: k.charts.revenueByMonth,
        rationale: "Monthly revenue from invoices issued in the last 12 months.",
      },
    };
  }
  if (/customer/.test(p) && /(top|spend|revenue)/.test(p)) {
    return {
      event: "ready",
      data: {
        spec: { id, type: "bar_horizontal", title: "Top customers by spend", subtitle: "Last 12 months", nameKey: "name", valueKey: "value", color: "violet" },
        rows: k.charts.topCustomers,
        rationale: "Sum of invoiced revenue per customer over the last 12 months, top 10.",
      },
    };
  }
  if (/job/.test(p) && /status/.test(p)) {
    return {
      event: "ready",
      data: {
        spec: { id, type: "donut", title: "Jobs by status", subtitle: "All open & recent jobs", nameKey: "name", valueKey: "value" },
        rows: k.charts.jobsByStatus,
        rationale: "Distribution of jobs across pipeline statuses.",
      },
    };
  }
  if (/equip|instrument/.test(p)) {
    return {
      event: "ready",
      data: {
        spec: { id, type: "bar", title: "Equipment by type", subtitle: "Active inventory", xKey: "name", yKey: "value", color: "violet" },
        rows: k.charts.equipmentByType,
        rationale: "Active equipment counts grouped by type.",
      },
    };
  }
  if (/tech|workload/.test(p)) {
    return {
      event: "ready",
      data: {
        spec: { id, type: "bar_stacked_horizontal", title: "Technician workload", subtitle: "Active vs completed", nameKey: "name", stackKeys: ["active", "completed"] },
        rows: k.charts.technicianWorkload,
        rationale: "Active vs completed jobs per technician over the last 30 days.",
      },
    };
  }
  if (/calibration|due/.test(p)) {
    return {
      event: "ready",
      data: {
        spec: { id, type: "bar", title: "Calibrations due by month", subtitle: "Next 6 months", xKey: "month", yKey: "due", color: "sky" },
        rows: k.charts.calibrationsDueByMonth,
        rationale: "Calibration due dates aggregated per upcoming month.",
      },
    };
  }
  return {
    event: "ready",
    data: {
      spec: { id, type: "bar", title: "Equipment by type", subtitle: "Best guess from your prompt", xKey: "name", yKey: "value", color: "violet" },
      rows: k.charts.equipmentByType,
      rationale: "Closest match found in the schema for the given prompt.",
    },
  };
}

export async function streamGenerateChart(
  prompt: string,
  onEvent: (e: ChartGenEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const wait = (ms: number) =>
    new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => resolve(), ms);
      signal?.addEventListener("abort", () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });

  const final = interpretPrompt(prompt);
  const draftTitle =
    final.event === "ready"
      ? final.data.spec.title
      : final.event === "error"
      ? final.data.draftTitle ?? "your request"
      : "your request";

  await wait(220);
  onEvent({ event: "status", data: { phase: "interpreting", message: "Understanding what you want…" } });

  if (final.event === "suggestions") {
    await wait(900);
    onEvent(final);
    return;
  }

  await wait(380);
  onEvent({ event: "status", data: { phase: "drafting", message: `Drafting "${draftTitle}"…` } });
  await wait(2400 + Math.random() * 2200);

  onEvent({ event: "status", data: { phase: "running", message: "Running 1 SQL query against the database…" } });
  await wait(900 + Math.random() * 700);

  onEvent({ event: "status", data: { phase: "validating", message: "Validating result…" } });
  await wait(420);

  if (final.event === "error") {
    onEvent(final);
    return;
  }
  onEvent({ event: "status", data: { phase: "rendering", message: "Rendering chart…" } });
  await wait(180);
  onEvent(final);
}

