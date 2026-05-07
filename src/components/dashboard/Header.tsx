import {
  Activity, Sparkles, RefreshCw, Settings as SettingsIcon,
  MessageSquare, MessageSquareOff, Database,
} from "lucide-react";

type Props = {
  dbMode: "mock" | "mssql";
  aiMode: "claude" | "nexus";
  chatOpen: boolean;
  onToggleChat: () => void;
  onRefresh: () => void;
  onOpenSettings: () => void;
  refreshing?: boolean;
};

export function Header({
  dbMode, aiMode, chatOpen, onToggleChat, onRefresh, onOpenSettings, refreshing,
}: Props) {
  return (
    <header className="flex items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-3">
        <div
          className="size-11 rounded-xl flex items-center justify-center shadow-lg"
          style={{
            background: "linear-gradient(135deg, oklch(0.66 0.22 290), oklch(0.74 0.2 295))",
            boxShadow: "0 8px 24px -8px oklch(0.66 0.22 290 / 0.6)",
          }}
        >
          <Activity className="size-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight">
              JM Test <span className="text-muted-foreground font-normal">·</span> Live Intelligence
            </h1>
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full rounded-full pulse-dot" style={{ background: "var(--emerald)" }} />
              <span className="relative inline-flex size-2 rounded-full" style={{ background: "var(--emerald)" }} />
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Calibration lab operations · AI-powered insights
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Chip icon={<Database className="size-3" />} label="DB" value={dbMode === "mssql" ? "SQL Server" : "Mock"} />
        <Chip icon={<Sparkles className="size-3" />} label="AI" value={aiMode === "claude" ? "Claude" : "Nexus"} />
        <button
          onClick={onToggleChat}
          className="px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 rounded-lg hover:bg-white/5"
        >
          {chatOpen ? <MessageSquareOff className="size-3.5" /> : <MessageSquare className="size-3.5" />}
          {chatOpen ? "Hide chat" : "Open chat"}
        </button>
        <button
          onClick={onRefresh}
          className="px-3 py-2 text-xs font-medium border border-white/10 hover:border-white/25 transition-colors rounded-lg flex items-center gap-1.5"
        >
          <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
        <button
          onClick={onOpenSettings}
          className="px-3 py-2 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all"
          style={{
            background: "linear-gradient(135deg, oklch(0.66 0.22 290), oklch(0.6 0.22 295))",
            color: "white",
            boxShadow: "0 4px 16px -6px oklch(0.66 0.22 290 / 0.6)",
          }}
        >
          <SettingsIcon className="size-3.5" />
          Settings
        </button>
      </div>
    </header>
  );
}

function Chip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border border-white/10 bg-white/5">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
