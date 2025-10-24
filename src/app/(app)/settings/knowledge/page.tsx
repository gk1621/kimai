"use client";

import { useEffect, useMemo, useState } from "react";
import Breadcrumbs from "@/components/layout/Breadcrumbs";

type PolicyItem = { id: number; text: string; display_order: number };
type Policies = { disclaimer: PolicyItem[]; pii_security: PolicyItem[]; triage_priority_rules: PolicyItem[]; handoff_protocol: { criteria: PolicyItem[]; action: string } };
type Scenario = { id: number; name: string; statute_of_limitations: string | null; question_count: number };
type Question = { id: number; question_text: string; order_index: number };

export default function KnowledgeSettingsPage() {
  const [firmId, setFirmId] = useState<string>("");
  const [policies, setPolicies] = useState<Policies | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [knowledgeUrl, setKnowledgeUrl] = useState<string>("");
  const [previewJson, setPreviewJson] = useState<string>("");

  const selectedScenario = useMemo(() => scenarios.find(s => s.id === selectedScenarioId) ?? null, [scenarios, selectedScenarioId]);

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(s => {
      const fid = s?.user?.firm_id ?? "";
      setFirmId(fid);
      if (fid) {
        refreshPolicies(fid);
        refreshScenarios(fid);
        refreshPreview(fid);
      }
    }).catch(() => {});
  }, []);

  function refreshPolicies(fid: string) {
    fetch(`/api/knowledge/policies?firm_id=${fid}`).then(r => r.json()).then(setPolicies).catch(() => setPolicies(null));
  }
  function refreshScenarios(fid: string) {
    fetch(`/api/knowledge/scenarios?firm_id=${fid}`).then(r => r.json()).then(setScenarios).catch(() => setScenarios([]));
  }
  function refreshQuestions(scenarioId: number) {
    fetch(`/api/knowledge/scenarios/${scenarioId}/questions`).then(r => r.json()).then(setQuestions).catch(() => setQuestions([]));
  }
  function refreshPreview(fid: string) {
    fetch(`/api/knowledge/${fid}`).then(r => r.json()).then(obj => {
      setKnowledgeUrl(obj?.knowledge_url || "");
      setPreviewJson(JSON.stringify(obj, null, 2));
    }).catch(() => setPreviewJson(""));
  }

  async function addPolicy(group_name: string, text: string) {
    if (!firmId || !text) return;
    await fetch('/api/knowledge/policies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firm_id: firmId, group_name, item_text: text }) });
    refreshPolicies(firmId);
    refreshPreview(firmId);
  }
  async function deletePolicy(id: number) {
    if (!firmId) return;
    await fetch('/api/knowledge/policies', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firm_id: firmId, id }) });
    refreshPolicies(firmId);
    refreshPreview(firmId);
  }

  async function togglePublic() {
    if (!firmId) return;
    const enabled = knowledgeUrl.includes('?token=');
    const action = enabled ? 'disable' : 'enable';
    const res = await fetch('/api/knowledge/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firm_id: firmId, action }) });
    if (res.ok) refreshPreview(firmId);
  }
  async function syncElevenLabs() {
    if (!firmId) return;
    const agent_id = prompt('Enter ElevenLabs Agent ID');
    if (!agent_id) return;
    const r = await fetch('/api/knowledge/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firm_id: firmId, agent_id }) });
    if (r.ok) alert('Synced to ElevenLabs'); else alert('Sync failed');
  }

  async function addScenario(e: any) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get('name') as string;
    const sol = (fd.get('sol') as string) || null;
    if (!firmId || !name) return;
    await fetch('/api/knowledge/scenarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firm_id: firmId, name, statute_of_limitations: sol }) });
    (e.target as HTMLFormElement).reset();
    refreshScenarios(firmId);
    refreshPreview(firmId);
  }

  async function addQuestion(e: any) {
    e.preventDefault();
    if (!firmId || !selectedScenarioId) return;
    const fd = new FormData(e.currentTarget);
    const question_text = fd.get('q') as string;
    if (!question_text) return;
    await fetch(`/api/knowledge/scenarios/${selectedScenarioId}/questions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firm_id: firmId, question_text }) });
    (e.target as HTMLFormElement).reset();
    refreshQuestions(selectedScenarioId);
    refreshPreview(firmId);
  }

  async function moveQuestion(idx: number, dir: -1 | 1) {
    if (!firmId || !selectedScenarioId) return;
    const arr = [...questions];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    const tmp = arr[idx];
    arr[idx] = arr[j];
    arr[j] = tmp;
    const updates = arr.map((q, i) => ({ id: q.id, order_index: i }));
    await fetch(`/api/knowledge/scenarios/${selectedScenarioId}/questions`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firm_id: firmId, updates }) });
    refreshQuestions(selectedScenarioId);
    refreshPreview(firmId);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Breadcrumbs lastLabel="Knowledge" />
        <h1 className="text-2xl font-semibold">Knowledge Configuration</h1>
      </div>

      {firmId && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="text-sm opacity-80">Public Knowledge URL</div>
              <div className="truncate font-mono text-xs">{knowledgeUrl || '—'}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { navigator.clipboard.writeText(knowledgeUrl); }} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10">Copy</button>
              <button onClick={togglePublic} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10">{knowledgeUrl.includes('?token=') ? 'Disable Token' : 'Enable Token'}</button>
              <button onClick={syncElevenLabs} className="px-3 py-2 rounded-lg bg-[var(--panel-start)] border border-white/10">Sync to ElevenLabs</button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card p-4 space-y-4">
        <h2 className="text-lg font-semibold">Global Policies</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="font-semibold mb-2">Disclaimers</div>
            <ul className="space-y-2">
              {policies?.disclaimer?.map(p => (
                <li key={p.id} className="flex items-start gap-2"><span className="flex-1 opacity-90">{p.text}</span><button onClick={() => deletePolicy(p.id)} className="text-red-400 text-sm">Remove</button></li>
              ))}
            </ul>
            <form className="mt-2 flex gap-2" onSubmit={(e:any)=>{e.preventDefault(); const t=(e.currentTarget as any).q.value as string; if(t) addPolicy('disclaimer', t); (e.target as HTMLFormElement).reset();}}>
              <input name="q" placeholder="Add disclaimer" className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
              <button className="px-3 py-2 rounded-lg bg-[var(--panel-start)] border border-white/10">Add</button>
            </form>
          </div>
          <div>
            <div className="font-semibold mb-2">PII Security</div>
            <ul className="space-y-2">
              {policies?.pii_security?.map(p => (
                <li key={p.id} className="flex items-start gap-2"><span className="flex-1 opacity-90">{p.text}</span><button onClick={() => deletePolicy(p.id)} className="text-red-400 text-sm">Remove</button></li>
              ))}
            </ul>
            <form className="mt-2 flex gap-2" onSubmit={(e:any)=>{e.preventDefault(); const t=(e.currentTarget as any).q.value as string; if(t) addPolicy('pii_security', t); (e.target as HTMLFormElement).reset();}}>
              <input name="q" placeholder="Add rule" className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
              <button className="px-3 py-2 rounded-lg bg-[var(--panel-start)] border border-white/10">Add</button>
            </form>
          </div>
          <div>
            <div className="font-semibold mb-2">Triage Rules</div>
            <ul className="space-y-2">
              {policies?.triage_priority_rules?.map(p => (
                <li key={p.id} className="flex items-start gap-2"><span className="flex-1 opacity-90">{p.text}</span><button onClick={() => deletePolicy(p.id)} className="text-red-400 text-sm">Remove</button></li>
              ))}
            </ul>
            <form className="mt-2 flex gap-2" onSubmit={(e:any)=>{e.preventDefault(); const t=(e.currentTarget as any).q.value as string; if(t) addPolicy('triage_priority_rules', t); (e.target as HTMLFormElement).reset();}}>
              <input name="q" placeholder="Add triage rule" className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
              <button className="px-3 py-2 rounded-lg bg-[var(--panel-start)] border border-white/10">Add</button>
            </form>
          </div>
          <div>
            <div className="font-semibold mb-2">Handoff Protocol</div>
            <div className="opacity-80 text-sm mb-1">Criteria</div>
            <ul className="space-y-2">
              {policies?.handoff_protocol?.criteria?.map(p => (
                <li key={p.id} className="flex items-start gap-2"><span className="flex-1 opacity-90">{p.text}</span><button onClick={() => deletePolicy(p.id)} className="text-red-400 text-sm">Remove</button></li>
              ))}
            </ul>
            <form className="mt-2 flex gap-2" onSubmit={(e:any)=>{e.preventDefault(); const t=(e.currentTarget as any).q.value as string; if(t) addPolicy('handoff_criteria', t); (e.target as HTMLFormElement).reset();}}>
              <input name="q" placeholder="Add criterion" className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
              <button className="px-3 py-2 rounded-lg bg-[var(--panel-start)] border border-white/10">Add</button>
            </form>
            <div className="opacity-80 text-sm mt-4">Action</div>
            <form className="mt-2 flex gap-2" onSubmit={(e:any)=>{e.preventDefault(); const t=(e.currentTarget as any).q.value as string; if(t) addPolicy('handoff_action', t); (e.target as HTMLFormElement).reset();}}>
              <input name="q" defaultValue={policies?.handoff_protocol?.action || ''} placeholder="Action text" className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
              <button className="px-3 py-2 rounded-lg bg-[var(--panel-start)] border border-white/10">Save</button>
            </form>
          </div>
        </div>
      </div>

      <div className="glass-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Scenarios</h2>
        </div>
        <form className="grid md:grid-cols-3 gap-3" onSubmit={addScenario}>
          <input name="name" required placeholder="Scenario name" className="px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
          <input name="sol" placeholder="Statute of Limitations (text)" className="px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
          <button className="px-3 py-2 rounded-lg bg-[var(--panel-start)] border border-white/10">Add</button>
        </form>
        <div className="flex flex-wrap gap-2">
          {scenarios.map(s => (
            <button key={s.id} onClick={() => { setSelectedScenarioId(s.id); refreshQuestions(s.id); }} className={`px-3 py-1 rounded-full border border-white/10 ${selectedScenarioId===s.id? 'bg-white/10' : 'bg-white/5'}`}>{s.name}</button>
          ))}
        </div>
      </div>

      {selectedScenario && (
        <div className="glass-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Questions – {selectedScenario.name}</h2>
          </div>
          <form className="flex gap-2" onSubmit={addQuestion}>
            <input name="q" placeholder="Add question" className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
            <button className="px-3 py-2 rounded-lg bg-[var(--panel-start)] border border-white/10">Add</button>
          </form>
          <ul className="divide-y divide-white/10">
            {questions.map((q, idx) => (
              <li key={q.id} className="flex items-center gap-2 py-2">
                <span className="flex-1 opacity-90">{q.question_text}</span>
                <div className="flex gap-1">
                  <button onClick={()=>moveQuestion(idx, -1)} className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10">Up</button>
                  <button onClick={()=>moveQuestion(idx, 1)} className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10">Down</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">JSON Preview</h2>
          <div className="flex gap-2">
            <button onClick={() => { navigator.clipboard.writeText(previewJson); }} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10">Copy JSON</button>
            <a href={`data:application/json;charset=utf-8,${encodeURIComponent(previewJson)}`} download={`knowledge_${firmId}.json`} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10">Download</a>
            <button onClick={() => firmId && refreshPreview(firmId)} className="px-3 py-2 rounded-lg bg-[var(--panel-start)] border border-white/10">Refresh</button>
          </div>
        </div>
        <pre className="max-h-96 overflow-auto text-xs bg-black/30 p-3 rounded-lg border border-white/10">{previewJson}</pre>
      </div>
    </div>
  );
}


