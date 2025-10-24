"use client";

import { useEffect, useMemo, useState } from "react";
import Breadcrumbs from "@/components/layout/Breadcrumbs";

type FirmSettings = { elevenlabs: any | null; twilio: any | null; agent: any | null };

export default function TwilioSettingsPage() {
  const [firmId, setFirmId] = useState<string>("");
  const [settings, setSettings] = useState<FirmSettings>({ elevenlabs: null, twilio: null, agent: null });
  const [saving, setSaving] = useState(false);
  const webhookUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const u = new URL(window.location.href);
    return `${u.origin}/api/webhook/voice`;
  }, []);

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
        <Breadcrumbs lastLabel="Twilio" />
        <h1 className="text-2xl font-semibold">Twilio Integration</h1>
      </div>
      <div className="glass-card p-4 space-y-4">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm opacity-70">Webhook (Voice) URL</label>
            <input className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10" value={webhookUrl} readOnly />
            <div className="text-xs opacity-70 mt-1">Set this as your Twilio Voice webhook (HTTP POST).</div>
          </div>
          <div>
            <label className="text-sm opacity-70">Stream WS URL</label>
            <input className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10" value={settings.twilio?.stream_ws_url ?? ""} onChange={e => update(["twilio","stream_ws_url"], e.target.value)} placeholder="wss://your-domain/api/stream" />
            <div className="text-xs opacity-70 mt-1">This must be publicly accessible via WSS for Twilio Media Streams.</div>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="text-sm opacity-70">Phone Number SID (optional)</label>
            <input className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10" value={settings.twilio?.phone_sid ?? ""} onChange={e => update(["twilio","phone_sid"], e.target.value)} placeholder="PNxxxxxxxx" />
          </div>
          <div>
            <label className="text-sm opacity-70">Account SID (optional)</label>
            <input className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10" value={settings.twilio?.account_sid ?? ""} onChange={e => update(["twilio","account_sid"], e.target.value)} placeholder="ACxxxxxxxx" />
          </div>
          <div>
            <label className="text-sm opacity-70">Auth Token (store securely)</label>
            <input type="password" className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10" value={settings.twilio?.auth_token ?? ""} onChange={e => update(["twilio","auth_token"], e.target.value)} placeholder="••••••" />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={save} disabled={!firmId || saving} className="px-4 py-2 rounded-lg bg-[var(--panel-start)] hover:opacity-90 border border-white/10">{saving ? "Saving..." : "Save"}</button>
        </div>
      </div>
    </div>
  );
}


