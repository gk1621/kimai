import { headers, cookies } from "next/headers";
import Breadcrumbs from "@/components/layout/Breadcrumbs";

type Props = { params: Promise<{ id: string }> };

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;
  const h = headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const baseUrl = `${proto}://${host}`;
  const cookieHeader = cookies().toString();

  const [leadRes, txRes, tasksRes] = await Promise.all([
    fetch(`${baseUrl}/api/leads/${id}`, { cache: 'no-store', headers: { cookie: cookieHeader } }),
    fetch(`${baseUrl}/api/leads/${id}/transcripts?limit=5`, { cache: 'no-store', headers: { cookie: cookieHeader } }),
    fetch(`${baseUrl}/api/leads/${id}/tasks?limit=10`, { cache: 'no-store', headers: { cookie: cookieHeader } }),
  ]);
  if (!leadRes.ok) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Lead {id}</h1>
        <div className="glass-card p-4 text-red-400">Failed to load lead (HTTP {leadRes.status})</div>
      </div>
    );
  }
  const lead = await leadRes.json() as any;
  const txJson = txRes.ok ? await txRes.json() as any : { data: [] };
  const transcripts = Array.isArray(txJson.data) ? txJson.data : [];
  const transcript = transcripts.length ? transcripts[0] : null;
  const tasksJson = tasksRes.ok ? await tasksRes.json() as any : { data: [] };
  const tasks = Array.isArray(tasksJson.data) ? tasksJson.data : [];
  let structured: any = null;
  try {
    if (transcript?.structured_json) structured = JSON.parse(transcript.structured_json);
  } catch {}

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Breadcrumbs lastLabel={lead.full_name ?? 'Lead'} />
        <h1 className="text-2xl font-semibold">Lead | {lead.full_name ?? '—'}</h1>
      </div>
      <div className="grid md:grid-cols-[280px_1fr_360px] gap-4">
        <aside className="glass-card p-4 space-y-3">
          <div className="space-y-1">
            <div className="text-sm opacity-70">Contact</div>
            <div className="text-lg font-semibold">{lead.full_name ?? '—'}</div>
            <div className="opacity-90">{lead.best_phone ?? ''}</div>
            <div className="opacity-90">{lead.email ?? ''}</div>
            <div className="flex gap-2 pt-2">
              {lead.best_phone && <a className="px-2 py-1 rounded bg-white/5 border border-white/10" href={`tel:${lead.best_phone}`}>Call</a>}
              {lead.email && <a className="px-2 py-1 rounded bg-white/5 border border-white/10" href={`mailto:${lead.email}`}>Email</a>}
            </div>
          </div>

          <div className="space-y-1 pt-2">
            <div className="text-sm opacity-70">Lead</div>
            <div>Status: <span className="font-medium">{lead.status ?? '—'}</span></div>
            <div>Scenario: <span className="font-medium">{lead.scenario ?? '—'}</span></div>
            <div>Urgency: <span className="font-medium">{lead.urgency_index ?? '—'}</span></div>
            <div>Created: <span className="font-medium">{lead.created_at ? new Date(lead.created_at).toLocaleString() : '—'}</span></div>
          </div>

          <div className="space-y-1 pt-2">
            <div className="text-sm opacity-70">SOL</div>
            <div>Deadline: <span className="font-medium">{lead.sol_deadline ?? '—'}</span></div>
            <div>Days to SOL: <span className="font-medium">{lead.days_to_sol ?? '—'}</span></div>
            <div>Within SOL: <span className="font-medium">{lead.within_sol === null || lead.within_sol === undefined ? '—' : (lead.within_sol ? 'Yes' : 'No')}</span></div>
          </div>
        </aside>

        {/* Middle column: Summary + Activity */}
        <div className="min-w-0 space-y-4 md:col-start-2 md:col-end-3">
          <section className="glass-card p-4 min-h-64 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Summary</h2>
            </div>
            {structured ? (
              <div className="grid md:grid-cols-2 gap-3">
                <div className="md:col-span-2 text-sm opacity-70">Latest intake</div>
                <div className="space-y-1">
                  <div className="text-base font-semibold opacity-80">Incident</div>
                  <div className="flex flex-wrap gap-2">
                    <div className="px-2 py-1 rounded border border-white/10 bg-white/5 break-words">
                      <span className="opacity-80">Scenario:</span>
                      <span className="font-medium ml-1">{structured.scenario ?? lead.scenario ?? '—'}</span>
                    </div>
                    <div className="px-2 py-1 rounded border border-white/10 bg-white/5 break-words">
                      <span className="opacity-80">Location:</span>
                      <span className="font-medium ml-1">{structured.incident?.location ?? '—'}</span>
                    </div>
                    <div className="px-2 py-1 rounded border border-white/10 bg-white/5 break-words">
                      <span className="opacity-80">Date:</span>
                      <span className="font-medium ml-1">{structured.incident?.date ?? '—'}</span>
                    </div>
                    <div className="px-2 py-1 rounded border border-white/10 bg-white/5 break-words">
                      <span className="opacity-80">Police report:</span>
                      <span className="font-medium ml-1">{structured.incident?.police_report === undefined ? '—' : (structured.incident?.police_report ? 'Yes' : 'No')}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-base font-semibold opacity-80">Defendant</div>
                  <div className="flex flex-wrap gap-2">
                    <div className="px-2 py-1 rounded border border-white/10 bg-white/5 break-words">
                      <span className="opacity-80">At fault:</span>
                      <span className="font-medium ml-1">{structured.defendant?.driver_at_fault ?? '—'}</span>
                    </div>
                    <div className="px-2 py-1 rounded border border-white/10 bg-white/5 break-words">
                      <span className="opacity-80">Other insurance:</span>
                      <span className="font-medium ml-1">{structured.defendant?.other_party_insurance ?? '—'}</span>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <div className="text-base font-semibold opacity-80">Description</div>
                  <div className="opacity-90 whitespace-pre-wrap break-words rounded border border-white/10 bg-white/5 p-3">{structured.incident?.description ?? '—'}</div>
                </div>
              </div>
            ) : (
              <div className="opacity-80">No structured summary available.</div>
            )}
          </section>

          <section className="glass-card p-4 min-h-64 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Activity</h2>
            </div>
            <div className="space-y-3">
              {transcripts.length ? (
                transcripts.map((t: any) => (
                  <div key={t.transcript_id} className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-white/50" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm opacity-70">Intake transcript • {new Date(t.created_at).toLocaleString()}</div>
                      <div className="text-sm opacity-90 line-clamp-3 break-words">{t.raw_text ?? ''}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="opacity-80">No recent activity.</div>
              )}
            </div>
          </section>
        </div>

        {/* Right column: Transcript + Upcoming */}
        <div className="min-w-0 space-y-4 md:col-start-3">
          <aside className="glass-card p-4 min-h-64 space-y-2">
            <h2 className="text-lg font-semibold">Transcript</h2>
            {transcript?.raw_text ? (
              <pre className="text-sm whitespace-pre-wrap break-words max-h-[480px] overflow-auto">{transcript.raw_text}</pre>
            ) : (
              <div className="opacity-80">No transcript found.</div>
            )}
            {transcript?.created_at && (
              <div className="text-xs opacity-70">Recorded {new Date(transcript.created_at).toLocaleString()}</div>
            )}
          </aside>

          <aside className="glass-card p-4 min-h-64 space-y-2">
            <h2 className="text-lg font-semibold">Upcoming</h2>
            {tasks.length ? (
              <div className="space-y-2">
                {tasks.map((t: any) => (
                  <div key={t.task_id} className="flex items-center justify-between gap-2 px-2 py-1 rounded border border-white/10 bg-white/5">
                    <div className="text-sm font-medium truncate">{t.title}</div>
                    <div className="text-xs opacity-70 whitespace-nowrap">{t.due_at ? new Date(t.due_at).toLocaleString() : 'No due date'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="opacity-80">No upcoming items.</div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}



