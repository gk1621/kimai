export default function Landing() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <section className="max-w-5xl w-full grid md:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Welcome to KIMAI</h1>
          <p className="text-base opacity-80">Sign in to continue or create an account.</p>
          <div className="grid grid-cols-1 gap-4">
            <a href="/sign-in" className="px-5 py-3 rounded-2xl bg-[var(--accent)] text-[var(--on-accent)] text-center">Sign In</a>
          </div>
        </div>
      </section>
    </main>
  );
}
