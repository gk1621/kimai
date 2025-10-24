"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type LeadRow = {
  lead_id: string;
  contact_id: string;
  full_name: string;
  best_phone: string | null;
  status: string | null;
  scenario: string | null;
  created_at: string;
};

const STATUS_OPTIONS = ["NEW", "QUALIFIED", "SCREENING", "CONSULT_SCHEDULED", "SIGNED", "DECLINED", "DEFERRED", "RETAINER_OUT", "CONFLICT"];
const SCENARIO_OPTIONS = ["MOTOR_VEHICLE", "PREMISES", "MEDICAL", "WORKLOSS", "EMPLOYMENT", "OTHER"];

export default function LeadsPage() {
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [scenario, setScenario] = useState<string>("");
  const [page, setPage] = useState(1);

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (status) sp.set("status", status);
    if (scenario) sp.set("scenario", scenario);
    sp.set("page", String(page));
    return sp.toString();
  }, [q, status, scenario, page]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/leads?${query}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setRows(json.data as LeadRow[]);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [query]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Leads</h1>

      <div className="glass-card p-4 space-y-3">
        <div className="grid md:grid-cols-4 gap-3">
          <input
            value={q}
            onChange={e => { setPage(1); setQ(e.target.value); }}
            placeholder="Search name or phone"
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10"
          />
          <select
            value={status}
            onChange={e => { setPage(1); setStatus(e.target.value); }}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={scenario}
            onChange={e => { setPage(1); setScenario(e.target.value); }}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10"
          >
            <option value="">All Scenarios</option>
            {SCENARIO_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <button onClick={() => { setQ(""); setStatus(""); setScenario(""); setPage(1); }} className="px-3 py-2 rounded-lg bg-[var(--panel-start)] border border-white/10">Reset</button>
          </div>
        </div>

        <div className="overflow-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left px-3 py-2">Contact</th>
                <th className="text-left px-3 py-2">Phone</th>
                <th className="text-left px-3 py-2">Scenario</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Created</th>
                <th className="text-left px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-3 py-6 text-center opacity-80">Loading…</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-red-400">{error}</td></tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-6 text-center opacity-80">No leads found</td></tr>
              )}
              {!loading && !error && rows.map(row => (
                <tr key={row.lead_id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="px-3 py-2"><Link className="underline" href={`/leads/${row.lead_id}`}>{row.full_name}</Link></td>
                  <td className="px-3 py-2">{row.best_phone ?? ""}</td>
                  <td className="px-3 py-2">{row.scenario ?? ""}</td>
                  <td className="px-3 py-2">{row.status ?? ""}</td>
                  <td className="px-3 py-2">{new Date(row.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <Link className="underline" href={`/leads/${row.lead_id}`}>Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-50"
          >Prev</button>
          <div className="opacity-80">Page {page}</div>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={loading || rows.length < 20}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-50"
          >Next</button>
        </div>
      </div>

      <div className="glass-card p-4">Kanban placeholder</div>
    </div>
  );
}



