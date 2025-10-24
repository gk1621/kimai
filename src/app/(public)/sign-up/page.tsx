"use client";
import { useState } from "react";

export default function SignUpPage() {
  const [firmName, setFirmName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/sign-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firmName, name, email, password }),
    });
    setLoading(false);
    if (res.ok) {
      window.location.href = "/sign-in";
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to sign up");
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="glass-card w-full max-w-md p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Create your account</h1>
          <p className="text-sm opacity-75">Start your firm workspace.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Firm name">
            <input value={firmName} onChange={(e) => setFirmName(e.target.value)} required className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 outline-none focus:border-white/25" />
          </Field>
          <Field label="Your name">
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 outline-none focus:border-white/25" />
          </Field>
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 outline-none focus:border-white/25" />
          </Field>
          <Field label="Password">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 outline-none focus:border-white/25" />
          </Field>
          {error && <div className="text-sm text-red-400">{error}</div>}
          <button disabled={loading} className="w-full px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--on-accent)]">{loading ? "Creating..." : "Create account"}</button>
        </form>
        <div className="text-sm opacity-75 text-center">
          Already have an account? <a className="underline" href="/sign-in">Sign in</a>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm opacity-80">{label}</label>
      {children}
    </div>
  );
}


