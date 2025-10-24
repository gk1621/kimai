import { auth } from "@/lib/auth";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import ElevenLabsWidget from "@/components/integrations/ElevenLabsWidget";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <div className="glass-card p-8 max-w-md w-full text-center space-y-4">
          <h1 className="text-xl font-semibold">You must sign in</h1>
          <p className="opacity-80">Access to the dashboard requires authentication.</p>
          <div className="flex justify-center">
            <Link href="/sign-in" className="px-5 py-2 rounded-xl bg-[var(--accent)] text-[var(--on-accent)]">Go to Sign In</Link>
          </div>
        </div>
      </main>
    );
  }
  return (
    <>
      <AppShell>{children}</AppShell>
      <ElevenLabsWidget />
    </>
  );
}

