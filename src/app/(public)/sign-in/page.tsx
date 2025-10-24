"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { redirect: false, email, password });
    setLoading(false);
    if (res?.ok) {
      window.location.href = "/dashboard";
    } else {
      setError("Invalid credentials");
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="glass-card w-full max-w-md p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="text-sm opacity-75">Welcome back. Enter your credentials.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm opacity-80">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 outline-none focus:border-white/25"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm opacity-80">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 outline-none focus:border-white/25"
            />
          </div>
          {error && <div className="text-sm text-red-400">{error}</div>}
          <button disabled={loading} className="w-full px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--on-accent)]">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="text-sm opacity-75 text-center">
          No account? <a className="underline" href="/sign-up">Create one</a>
        </div>
      </div>
    </main>
  );
}


