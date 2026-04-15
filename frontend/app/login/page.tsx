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
      style={{ background: "radial-gradient(ellipse at 50% 0%, #1e1040 0%, #0d0d1a 50%, #0f172a 100%)" }}
    >
      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-600 flex items-center justify-center text-3xl mb-5 shadow-2xl shadow-violet-900/60 ring-4 ring-violet-500/20">
            🧭
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Smart Trip Planner</h1>
          <p className="text-slate-400 text-sm mt-2">Plan your next adventure with AI</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-slate-800">
            {(["login", "signup"] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); }}
                className={`flex-1 py-4 text-sm font-semibold transition-all ${
                  tab === t
                    ? "text-violet-400 border-b-2 border-violet-500 bg-violet-500/5"
                    : "text-slate-500 hover:text-slate-300 border-b-2 border-transparent"
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
                  <label className="block text-xs font-semibold text-slate-400 mb-2 tracking-wide">Full name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="Your name"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 tracking-wide">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 tracking-wide">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="8+ characters"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>

              {error && (
                <div className="flex items-start gap-3 bg-red-950/50 border border-red-800/50 rounded-xl px-4 py-3">
                  <span className="text-red-400 text-sm mt-0.5">⚠</span>
                  <p className="text-xs text-red-400 leading-relaxed">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-500 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-violet-900/50 mt-2"
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

            <p className="text-center text-xs text-slate-600 mt-6">
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
            <div key={f.label} className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <span className="text-xl">{f.icon}</span>
              <span className="text-xs text-slate-500 text-center leading-tight">{f.label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
