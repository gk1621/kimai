export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <a href="/settings/agent" className="glass-card p-4 rounded-xl border border-white/10 hover:bg-white/5 transition-colors">
          <div className="text-lg font-semibold mb-1">Agent</div>
          <div className="opacity-80 text-sm">Voice, persona, intake behavior</div>
        </a>
        <a href="/settings/knowledge" className="glass-card p-4 rounded-xl border border-white/10 hover:bg-white/5 transition-colors">
          <div className="text-lg font-semibold mb-1">Knowledge</div>
          <div className="opacity-80 text-sm">Practice areas, case types, question flows</div>
        </a>
        <a href="/settings/twilio" className="glass-card p-4 rounded-xl border border-white/10 hover:bg-white/5 transition-colors">
          <div className="text-lg font-semibold mb-1">Twilio</div>
          <div className="opacity-80 text-sm">Webhook and streaming configuration</div>
        </a>
      </div>
    </div>
  );
}



