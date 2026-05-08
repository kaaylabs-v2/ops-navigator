import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/dashboard/Header";
import { Briefing } from "@/components/dashboard/Briefing";
import { KpiTiles } from "@/components/dashboard/KpiTiles";
import { ChartGrid } from "@/components/dashboard/ChartGrid";
import { DataTables } from "@/components/dashboard/DataTables";
import { ChatPanel } from "@/components/dashboard/ChatPanel";
import { SettingsModal } from "@/components/dashboard/SettingsModal";
import {
  fetchKpis, fetchInsights, fetchSettings,
  type KpiData, type Insights, type Settings,
} from "@/lib/mock-api";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JM Test · Live Intelligence" },
      { name: "description", content: "AI-powered operations dashboard for calibration & testing labs. Always-on intelligence, chat with your database, pluggable backbone." },
      { property: "og:title", content: "JM Test · Live Intelligence" },
      { property: "og:description", content: "AI-powered operations dashboard for calibration & testing labs." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [insLoading, setInsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      const [k, i, s] = await Promise.all([fetchKpis(), fetchInsights(), fetchSettings()]);
      setKpis(k); setInsights(i); setSettings(s);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setLoading(false); setInsLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const meta = kpis?.meta;
  const generated = meta ? new Date(meta.generatedAt).toLocaleTimeString("en", { hour12: false }) : "—";

  return (
    <div className="min-h-screen flex">
      <main className="flex-1 min-w-0 px-6 lg:px-8 py-6 overflow-x-hidden">
        <div className="max-w-[1400px] mx-auto">
          <Header
            dbMode={settings?.dbMode ?? "mock"}
            aiMode={settings?.aiMode ?? "claude"}
            chatOpen={chatOpen}
            onToggleChat={() => setChatOpen((v) => !v)}
            onRefresh={() => load(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            refreshing={refreshing}
          />

          {error && (
            <div className="card-surface p-4 mb-6 flex items-start gap-3"
              style={{ borderColor: "color-mix(in oklch, var(--rose) 40%, transparent)", background: "color-mix(in oklch, var(--rose) 8%, transparent)" }}>
              <AlertTriangle className="size-4 mt-0.5 shrink-0" style={{ color: "var(--rose)" }} />
              <div className="text-sm">
                <strong>Error: {error}.</strong>{" "}
                <span className="text-muted-foreground">The backend may not be running. Try <code className="mono">npm run dev</code> in the project root.</span>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <Briefing data={insights} loading={insLoading} />
            <KpiTiles data={kpis} loading={loading} />
            <ChartGrid data={kpis} />
            <DataTables data={kpis} />
          </div>

          <footer className="mt-8 pt-4 border-t border-white/5 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>Generated {generated}</span>
            <span>·</span>
            <span>DB:</span>
            <span className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5">{meta?.dbMode ?? "—"}</span>
            <span>·</span>
            <span>Dialect:</span>
            <span className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5">{meta?.dialect ?? "—"}</span>
          </footer>
        </div>
      </main>

      <aside
        className={`shrink-0 sticky top-0 h-screen transition-all duration-300 ease-out overflow-hidden ${
          chatOpen ? "w-[420px]" : "w-0"
        }`}
      >
        <div className="h-screen p-4 pl-0">
          <ChatPanel aiMode={settings?.aiMode ?? "claude"} />
        </div>
      </aside>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={(s) => { setSettings(s); load(true); }}
      />
    </div>
  );
}
