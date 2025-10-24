export default function TranscriptsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Transcripts</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass-card p-4 min-h-64">Transcript list</div>
        <div className="glass-card p-4 min-h-64">Transcript | JSON diff</div>
      </div>
    </div>
  );
}



