import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";

type CountByLabel = { label: string; count: number };
type TaskRow = { task_id: string; title: string; due_at: string | null; lead_id: string | null; full_name: string | null };
type SolRow = { lead_id: string; full_name: string; sol_deadline: string; days_to_sol: number | null };
type SimpleLead = { lead_id: string; full_name: string; created_at: string };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;
  const firmId = (session as any).user.firm_id as string;
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [statusLast30, totalLast30, pipelineNow, scenarioLast30, sourcesLast30, solAtRiskCount, solSoonRows, upcomingTasks, recentSigned] = await Promise.all([
    // Status breakdown for leads created in last 30 days
    pool.query("SELECT status AS label, COUNT(*) AS count FROM leads WHERE firm_id=? AND created_at>=? GROUP BY status", [firmId, since]) as any,
    pool.query("SELECT COUNT(*) AS count FROM leads WHERE firm_id=? AND created_at>=?", [firmId, since]) as any,
    // Current pipeline by status (all time)
    pool.query("SELECT status AS label, COUNT(*) AS count FROM leads WHERE firm_id=? GROUP BY status", [firmId]) as any,
    // Scenario distribution (last 30)
    pool.query("SELECT scenario AS label, COUNT(*) AS count FROM leads WHERE firm_id=? AND created_at>=? GROUP BY scenario", [firmId, since]) as any,
    // Top referral sources (last 30)
    pool.query("SELECT COALESCE(referral_source,'Unknown') AS label, COUNT(*) AS count FROM leads WHERE firm_id=? AND created_at>=? GROUP BY referral_source ORDER BY count DESC LIMIT 5", [firmId, since]) as any,
    // SOL at risk (count) within 30 days
    pool.query("SELECT COUNT(*) AS count FROM leads WHERE firm_id=? AND within_sol=TRUE AND days_to_sol IS NOT NULL AND days_to_sol<=30", [firmId]) as any,
    // Next 5 SOL deadlines
    pool.query("SELECT l.lead_id, c.full_name, l.sol_deadline, l.days_to_sol FROM leads l JOIN contacts c ON l.contact_id=c.contact_id WHERE l.firm_id=? AND l.within_sol=TRUE AND l.sol_deadline IS NOT NULL ORDER BY l.sol_deadline ASC LIMIT 5", [firmId]) as any,
    // Upcoming tasks
    pool.query("SELECT t.task_id, t.title, t.due_at, t.lead_id, c.full_name FROM tasks t LEFT JOIN leads l ON t.lead_id=l.lead_id LEFT JOIN contacts c ON l.contact_id=c.contact_id WHERE t.firm_id=? AND t.status IN ('OPEN','IN_PROGRESS') AND t.due_at IS NOT NULL ORDER BY t.due_at ASC LIMIT 5", [firmId]) as any,
    // Recent signed clients
    pool.query("SELECT l.lead_id, c.full_name, l.created_at FROM leads l JOIN contacts c ON l.contact_id=c.contact_id WHERE l.firm_id=? AND l.status='SIGNED' ORDER BY l.created_at DESC LIMIT 5", [firmId]) as any,
  ]);

  const statusByLabel30: Record<string, number> = Object.fromEntries(((statusLast30[0] as any[]) ?? []).map((r: any) => [r.label as string, Number(r.count)]));
  const totalCreated30 = Number((totalLast30[0] as any[])[0]?.count ?? 0);
  const signedCreated30 = statusByLabel30["SIGNED"] ?? 0;
  const consultsCreated30 = statusByLabel30["CONSULT_SCHEDULED"] ?? 0;
  const retainersOut30 = statusByLabel30["RETAINER_OUT"] ?? 0;
  const conversionRate = totalCreated30 > 0 ? Math.round((signedCreated30 / totalCreated30) * 100) : 0;
  const pipelineByStatus: CountByLabel[] = (pipelineNow[0] as any[]).map((r: any) => ({ label: r.label as string, count: Number(r.count) }));
  const activePipeline = pipelineByStatus.filter(p => ["NEW","SCREENING","QUALIFIED","CONSULT_SCHEDULED","RETAINER_OUT"].includes(p.label)).reduce((a, b) => a + b.count, 0);
  const scenarioBreakdown: CountByLabel[] = (scenarioLast30[0] as any[]).map((r: any) => ({ label: r.label as string, count: Number(r.count) }));
  const sourceBreakdown: CountByLabel[] = (sourcesLast30[0] as any[]).map((r: any) => ({ label: r.label as string, count: Number(r.count) }));
  const solAtRisk = Number((solAtRiskCount[0] as any[])[0]?.count ?? 0);
  const solRows: SolRow[] = (solSoonRows[0] as any[]).map((r: any) => ({ lead_id: r.lead_id, full_name: r.full_name, sol_deadline: r.sol_deadline, days_to_sol: r.days_to_sol == null ? null : Number(r.days_to_sol) }));
  const tasks: TaskRow[] = (upcomingTasks[0] as any[]).map((r: any) => ({ task_id: r.task_id, title: r.title, due_at: r.due_at, lead_id: r.lead_id ?? null, full_name: r.full_name ?? null }));
  const signedRecent: SimpleLead[] = (recentSigned[0] as any[]).map((r: any) => ({ lead_id: r.lead_id, full_name: r.full_name, created_at: r.created_at }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <KpiCard title="New Leads (30d)" value={String(totalCreated30)} />
        <KpiCard title="Signed Clients (30d)" value={String(signedCreated30)} />
        <KpiCard title="Conversion (30d)" value={`${conversionRate}%`} accent={conversionRate >= 20 ? "good" : conversionRate >= 10 ? "warn" : "bad"} />
        <KpiCard title="Active Pipeline" value={String(activePipeline)} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="glass-card p-6 xl:col-span-2">
          <h3 className="text-sm opacity-80 mb-3">Pipeline by Status</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pipelineByStatus.map(p => (
              <div key={p.label} className="rounded-lg bg-white/5 border border-white/10 p-3">
                <div className="text-xs opacity-70 mb-1">{p.label}</div>
                <div className="text-lg font-semibold">{p.count}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card p-6">
          <h3 className="text-sm opacity-80 mb-3">SOL Within 30 Days</h3>
          <div className="text-2xl font-semibold mb-3">{solAtRisk}</div>
          <div className="space-y-2">
            {solRows.length === 0 && <div className="text-sm opacity-70">No upcoming SOL deadlines</div>}
            {solRows.map(r => (
              <div key={r.lead_id} className="flex items-center justify-between text-sm">
                <div className="truncate pr-2">{r.full_name}</div>
                <div className="opacity-70">{new Date(r.sol_deadline).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="glass-card p-6 xl:col-span-2">
          <h3 className="text-sm opacity-80 mb-3">Leads by Scenario (30d)</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scenarioBreakdown.map(s => (
              <MiniBar key={s.label} label={s.label} value={s.count} max={Math.max(1, ...scenarioBreakdown.map(x => x.count))} />)
            )}
            {scenarioBreakdown.length === 0 && <div className="text-sm opacity-70">No data</div>}
          </div>
        </div>
        <div className="glass-card p-6">
          <h3 className="text-sm opacity-80 mb-3">Top Sources (30d)</h3>
          <div className="space-y-2">
            {sourceBreakdown.map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <div className="text-sm truncate pr-2">{s.label}</div>
                <div className="text-sm font-medium">{s.count}</div>
              </div>
            ))}
            {sourceBreakdown.length === 0 && <div className="text-sm opacity-70">No data</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="glass-card p-6">
          <h3 className="text-sm opacity-80 mb-3">Upcoming Tasks</h3>
          <div className="space-y-2">
            {tasks.length === 0 && <div className="text-sm opacity-70">No upcoming tasks</div>}
            {tasks.map(t => (
              <div key={t.task_id} className="flex items-center justify-between text-sm">
                <div className="truncate pr-2">{t.title}{t.full_name ? ` — ${t.full_name}` : ""}</div>
                <div className="opacity-70">{t.due_at ? new Date(t.due_at).toLocaleString() : ""}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card p-6">
          <h3 className="text-sm opacity-80 mb-3">Recent Signed Clients</h3>
          <div className="space-y-2">
            {signedRecent.length === 0 && <div className="text-sm opacity-70">No signed clients yet</div>}
            {signedRecent.map(l => (
              <div key={l.lead_id} className="flex items-center justify-between text-sm">
                <div className="truncate pr-2">{l.full_name}</div>
                <div className="opacity-70">{new Date(l.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card p-6">
          <h3 className="text-sm opacity-80 mb-3">Consults Scheduled (30d)</h3>
          <div className="text-2xl font-semibold">{consultsCreated30}</div>
          <div className="text-xs opacity-70 mt-1">Includes leads created in the last 30 days</div>
          <div className="mt-4">
            <h4 className="text-xs opacity-70 mb-2">Retainers Out (30d)</h4>
            <div className="text-lg font-semibold">{retainersOut30}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, accent }: { title: string; value: string; accent?: "good" | "warn" | "bad" }) {
  const color = accent === "good" ? "text-emerald-400" : accent === "warn" ? "text-amber-400" : accent === "bad" ? "text-red-400" : "text-white";
  return (
    <div className="glass-card p-4">
      <div className="text-xs opacity-70 mb-2">{title}</div>
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function MiniBar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = Math.max(8, Math.round((value / Math.max(1, max)) * 100));
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
      <div className="text-xs opacity-70 mb-1 truncate" title={label}>{label}</div>
      <div className="h-2 rounded bg-white/10 overflow-hidden">
        <div className="h-full bg-[var(--accent)]" style={{ width: `${width}%` }} />
      </div>
      <div className="text-xs opacity-70 mt-1">{value}</div>
    </div>
  );
}
