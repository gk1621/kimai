"use client";

import { useEffect, useState } from "react";
import Breadcrumbs from "@/components/layout/Breadcrumbs";

type FirmSettings = {
  elevenlabs: any | null;
  twilio: any | null;
  agent: any | null;
};

export default function AgentSettingsPage() {
  const [firmId, setFirmId] = useState<string>("");
  const [settings, setSettings] = useState<FirmSettings>({ elevenlabs: null, twilio: null, agent: null });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(s => {
      const fid = s?.user?.firm_id ?? "";
      setFirmId(fid);
      if (fid) {
        fetch(`/api/settings/firm?firm_id=${fid}`).then(r => r.json()).then(setSettings).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  function update(path: string[], value: any) {
    setSettings(prev => {
      const copy: FirmSettings = { ...prev, elevenlabs: prev.elevenlabs ?? {}, twilio: prev.twilio ?? {}, agent: prev.agent ?? {} };
      let cur: any = copy;
      for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]] = cur[path[i]] ?? {};
      cur[path[path.length - 1]] = value;
      return { ...copy };
    });
  }

  async function save() {
    if (!firmId) return;
    setSaving(true);
    try {
      await fetch("/api/settings/firm", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firm_id: firmId, ...settings }),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Breadcrumbs lastLabel="Agent" />
        <h1 className="text-2xl font-semibold">Agent Settings</h1>
      </div>
      <div className="glass-card p-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-sm opacity-70">Firm ID</label>
            <input className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10" value={firmId} onChange={e => setFirmId(e.target.value)} placeholder="firm_id" />
          </div>
          <div>
            <label className="text-sm opacity-70">ElevenLabs Voice ID</label>
            <input className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10" value={settings.elevenlabs?.voice_id ?? ""} onChange={e => update(["elevenlabs","voice_id"], e.target.value)} placeholder="voice id" />
          </div>
          <div>
            <label className="text-sm opacity-70">Stability</label>
            <input type="number" min={0} max={1} step={0.01} className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10" value={settings.elevenlabs?.stability ?? 0.5} onChange={e => update(["elevenlabs","stability"], parseFloat(e.target.value))} />
          </div>
          <div>
            <label className="text-sm opacity-70">Similarity Boost</label>
            <input type="number" min={0} max={1} step={0.01} className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10" value={settings.elevenlabs?.similarity_boost ?? 0.75} onChange={e => update(["elevenlabs","similarity_boost"], parseFloat(e.target.value))} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm opacity-70">Agent Persona Prompt</label>
            <textarea className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10" rows={4} value={settings.agent?.persona ?? ""} onChange={e => update(["agent","persona"], e.target.value)} placeholder="Tone, style, greeting, disclaimers..." />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={save} disabled={!firmId || saving} className="px-4 py-2 rounded-lg bg-[var(--panel-start)] hover:opacity-90 border border-white/10">{saving ? "Saving..." : "Save"}</button>
        </div>
      </div>
    </div>
  );
}


