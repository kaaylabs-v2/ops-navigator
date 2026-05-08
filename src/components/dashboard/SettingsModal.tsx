import { useEffect, useState } from "react";
import { X, Database, Sparkles, Info, Check, Server, Bot, CircleAlert } from "lucide-react";
import { fetchSettings, patchSettings, testConnection, type Settings } from "@/lib/mock-api";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (s: Settings) => void;
};

type TabId = "data" | "ai" | "about";

export function SettingsModal({ open, onClose, onSaved }: Props) {
  const [tab, setTab] = useState<TabId>("data");
  const [s, setS] = useState<Settings | null>(null);
  const [pw, setPw] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchSettings().then(setS);
      setPw(""); setApiKey(""); setTestResult(null);
    }
  }, [open]);

  if (!open || !s) return null;

  function update<K extends keyof Settings>(k: K, v: Settings[K]) {
    setS((prev) => prev ? { ...prev, [k]: v } : prev);
  }
  function updMssql(patch: Partial<Settings["mssql"]>) {
    setS((prev) => prev ? { ...prev, mssql: { ...prev.mssql, ...patch } } : prev);
  }
  function updNexus(patch: Partial<Settings["nexus"]>) {
    setS((prev) => prev ? { ...prev, nexus: { ...prev.nexus, ...patch } } : prev);
  }
  function updClaude(patch: Partial<Settings["claude"]>) {
    setS((prev) => prev ? { ...prev, claude: { ...prev.claude, ...patch } } : prev);
  }

  async function runTest() {
    if (!s) return;
    setTesting(true); setTestResult(null);
    const res = await testConnection({ ...s.mssql, password: pw });
    setTestResult({ ok: res.ok, msg: res.ok ? `Connected · ${res.version}` : (res.error || "Failed") });
    setTesting(false);
  }

  async function save() {
    if (!s) return;
    setSaving(true);
    const patch: any = { dbMode: s.dbMode, aiMode: s.aiMode, mssql: { ...s.mssql }, claude: { ...s.claude }, nexus: { ...s.nexus } };
    if (pw) patch.mssql.password = pw;
    if (apiKey) patch.claude.apiKey = apiKey;
    const updated = await patchSettings(patch);
    onSaved(updated);
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fade-up"
      style={{ background: "var(--modal-backdrop)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="card-surface w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden"
        style={{ background: "var(--surface-solid)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold tracking-tight">Settings</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[var(--row-hover)]">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          <nav className="w-[200px] border-r border-border p-3 space-y-1 shrink-0">
            <NavBtn active={tab === "data"} onClick={() => setTab("data")} icon={<Database className="size-4" />} label="Data source" />
            <NavBtn active={tab === "ai"} onClick={() => setTab("ai")} icon={<Sparkles className="size-4" />} label="AI backend" />
            <NavBtn active={tab === "about"} onClick={() => setTab("about")} icon={<Info className="size-4" />} label="About" />
          </nav>

          <div className="flex-1 overflow-y-auto p-6">
            {tab === "data" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <BigToggle
                    active={s.dbMode === "mock"} onClick={() => update("dbMode", "mock")}
                    icon={<Database className="size-5" />} title="Mock JM Test DB"
                    body="SQLite seeded with realistic calibration-lab data." />
                  <BigToggle
                    active={s.dbMode === "mssql"} onClick={() => update("dbMode", "mssql")}
                    icon={<Server className="size-5" />} title="Live SQL Server"
                    body="Connect to JM Test's actual production database." />
                </div>

                {s.dbMode === "mssql" && (
                  <div className="space-y-3 animate-fade-up">
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Host" col="col-span-2" value={s.mssql.host} onChange={(v) => updMssql({ host: v })} />
                      <Field label="Port" type="number" value={String(s.mssql.port)} onChange={(v) => updMssql({ port: parseInt(v) || 1433 })} />
                      <Field label="User" value={s.mssql.user} onChange={(v) => updMssql({ user: v })} />
                      <Field label="Password" type="password" value={pw} onChange={setPw}
                        placeholder={s.mssql.hasPassword ? "•••••••• (saved)" : ""} />
                      <Field label="Database" value={s.mssql.database} onChange={(v) => updMssql({ database: v })} />
                      <SelectField label="Encrypt" value={String(s.mssql.encrypt)} onChange={(v) => updMssql({ encrypt: v === "true" })} options={[["true","Yes"],["false","No"]]} />
                      <SelectField label="Trust server cert" col="col-span-2" value={String(s.mssql.trustServerCertificate)} onChange={(v) => updMssql({ trustServerCertificate: v === "true" })} options={[["true","Yes"],["false","No"]]} />
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <button onClick={runTest} disabled={testing}
                        className="px-3 py-2 text-xs font-medium border border-border rounded-lg hover:border-[var(--border-strong)] transition-colors disabled:opacity-50">
                        {testing ? "Testing…" : "Test connection"}
                      </button>
                      {testResult && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs"
                          style={{
                            background: testResult.ok ? "color-mix(in oklch, var(--emerald) 18%, transparent)" : "color-mix(in oklch, var(--rose) 18%, transparent)",
                            color: testResult.ok ? "var(--emerald)" : "var(--rose)",
                          }}>
                          {testResult.ok ? <Check className="size-3" /> : <CircleAlert className="size-3" />}
                          {testResult.msg}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "ai" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <BigToggle
                    active={s.aiMode === "claude"} onClick={() => update("aiMode", "claude")}
                    icon={<Sparkles className="size-5" />} title="Claude + SQL tools"
                    body="Direct Anthropic API. Claude writes SQL, runs it, replies." />
                  <BigToggle
                    active={s.aiMode === "nexus"} onClick={() => update("aiMode", "nexus")}
                    icon={<Bot className="size-5" />} title="Nexus chatbot"
                    body="POST through your Nexus gateway. Tenant-scoped bot." />
                </div>

                {s.aiMode === "claude" ? (
                  <div className="space-y-3 animate-fade-up">
                    <Field label="Model" value={s.claude.model} onChange={(v) => updClaude({ model: v })} />
                    <Field label="API key" type="password" value={apiKey} onChange={setApiKey}
                      placeholder={s.claude.hasApiKey ? "•••••••• (saved)" : "sk-ant-…"} />
                  </div>
                ) : (
                  <div className="space-y-3 animate-fade-up">
                    <Field label="Endpoint URL" value={s.nexus.url} onChange={(v) => updNexus({ url: v })} />
                    <Field label="tenant_uid" mono value={s.nexus.tenantUid} onChange={(v) => updNexus({ tenantUid: v })} placeholder="00000000-0000-0000-0000-000000000000" />
                    <Field label="bot_uid" mono value={s.nexus.botUid} onChange={(v) => updNexus({ botUid: v })} placeholder="00000000-0000-0000-0000-000000000000" />
                    <Field label="Source label" value={s.nexus.source} onChange={(v) => updNexus({ source: v })} />
                    <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                      <code className="mono">tenant_uid</code> + <code className="mono">bot_uid</code> are how Nexus
                      authenticates this gateway endpoint — there is no separate API key. Treat them as secrets.
                    </p>
                  </div>
                )}
              </div>
            )}

            {tab === "about" && (
              <div className="space-y-4 text-sm leading-relaxed">
                <h3 className="font-semibold">Architecture</h3>
                <div className="flex flex-wrap gap-1.5">
                  {["Frontend", "Backend", "AI: Claude path", "AI: Nexus path"].map((c) => (
                    <span key={c} className="px-2 py-0.5 rounded-md text-xs border border-border bg-[var(--input-bg)]">{c}</span>
                  ))}
                </div>
                <ul className="space-y-2 text-muted-foreground text-xs">
                  <li><strong className="text-foreground">Frontend:</strong> React + Tailwind dashboard rendered as a single executive view with a persistent chat panel.</li>
                  <li><strong className="text-foreground">Backend:</strong> Node/Express gateway translating between SQLite (mock) and Microsoft SQL Server (live).</li>
                  <li><strong className="text-foreground">AI: Claude path:</strong> Anthropic SDK with a tool-use loop over <code className="mono">get_schema</code> and <code className="mono">execute_sql</code>, capped at 6 turns.</li>
                  <li><strong className="text-foreground">AI: Nexus path:</strong> POST to your Nexus chat gateway with a stable per-process session for multi-turn context.</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-[var(--row-hover)] transition-colors">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="px-4 py-2 text-xs font-medium rounded-lg transition-all disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, var(--violet), var(--violet-glow))",
              color: "white",
            }}>
            {saving ? "Saving…" : "Save & apply"}
          </button>
        </div>
      </div>
    </div>
  );
}

function NavBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
        active ? "bg-[var(--ai-mark-bg)] text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-[var(--row-hover)]"
      }`}>
      {icon}{label}
    </button>
  );
}

function BigToggle({ active, onClick, icon, title, body }: any) {
  return (
    <button onClick={onClick}
      className={`text-left p-4 rounded-xl border transition-all ${
        active ? "bg-[var(--input-bg)]" : "border-border hover:border-[var(--border-strong)]"
      }`}
      style={active ? { borderColor: "var(--violet)", boxShadow: "0 0 0 1px oklch(0.66 0.22 290 / 0.3)" } : undefined}>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color: active ? "var(--violet-glow)" : "var(--muted-foreground)" }}>{icon}</span>
        <span className="font-semibold text-sm">{title}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
    </button>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, col, mono }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; col?: string; mono?: boolean;
}) {
  return (
    <div className={col}>
      <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-medium">{label}</label>
      <input type={type} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-[var(--input-bg)] border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30 ${mono ? "mono" : ""}`} />
    </div>
  );
}

function SelectField({ label, value, onChange, options, col }: {
  label: string; value: string; onChange: (v: string) => void; options: [string, string][]; col?: string;
}) {
  return (
    <div className={col}>
      <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-medium">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[var(--input-bg)] border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30">
        {options.map(([v, l]) => <option key={v} value={v} style={{ background: "#1a1a2e" }}>{l}</option>)}
      </select>
    </div>
  );
}
