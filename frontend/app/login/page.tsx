"use client";
import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();

  const [tab, setTab] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email, password, name, mode: tab, redirect: false,
      });
      if (result?.error) {
        setError(result.error === "CredentialsSignin" ? "Invalid email or password" : result.error);
      } else {
        router.replace("/");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "radial-gradient(ellipse at 50% -20%, #1e0a4a 0%, #0d0d18 50%, #090910 100%)" }}
    >
      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-600 flex items-center justify-center text-3xl mb-5 shadow-2xl shadow-violet-900/60 ring-4 ring-violet-500/20">
            🧭
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Smart Trip Planner</h1>
          <p className="text-zinc-400 text-sm mt-2">Plan your next adventure with AI</p>
        </div>

        {/* Card */}
        <div className="bg-[#111118] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-white/5">
            {(["login", "signup"] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); }}
                className={`flex-1 py-4 text-sm font-semibold transition-all ${
                  tab === t
                    ? "text-violet-400 border-b-2 border-violet-500 bg-violet-500/5"
                    : "text-zinc-500 hover:text-zinc-300 border-b-2 border-transparent"
                }`}
              >
                {t === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {tab === "signup" && (
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-zinc-400 mb-2 tracking-wide">Full name</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="Your name"
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all w-full"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-zinc-400 mb-2 tracking-wide">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all w-full"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-zinc-400 mb-2 tracking-wide">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="8+ characters"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all w-full"
                />
              </div>

              {error && (
                <div
                  className="flex items-start gap-3 bg-red-950/50 border border-red-800/50 rounded-xl px-4 py-3"
                  role="alert"
                  aria-live="polite"
                >
                  <span className="text-red-400 text-sm mt-0.5">⚠</span>
                  <p className="text-xs text-red-400 leading-relaxed">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold text-white flex items-center justify-center gap-2 shadow-lg shadow-violet-900/40 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111118] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Please wait…
                  </>
                ) : (
                  tab === "login" ? "Sign in" : "Create account"
                )}
              </button>
            </form>

            <p className="text-center text-xs text-zinc-600 mt-6">
              <Link href="/" className="hover:text-violet-400 transition-colors">
                ← Back to planner
              </Link>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 mt-8">
          {[
            { icon: "✨", label: "AI itineraries" },
            { icon: "🗺️", label: "Live maps" },
            { icon: "💾", label: "Save & share" },
          ].map(f => (
            <div key={f.label} className="flex flex-col items-center gap-2 py-4 px-2 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-xl">{f.icon}</span>
              <span className="text-xs text-zinc-500 text-center leading-tight">{f.label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
