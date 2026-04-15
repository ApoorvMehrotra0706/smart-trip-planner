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
        email,
        password,
        name,
        mode: tab,
        redirect: false,
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
      className="min-h-screen flex"
      style={{ background: "radial-gradient(ellipse at 30% 20%, #1e1040 0%, #0a0a1a 55%, #0f172a 100%)" }}
    >
      {/* Left decorative panel — hidden on small screens */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ background: "radial-gradient(ellipse at 40% 50%, #7c3aed 0%, transparent 70%)" }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-xl">
              🧭
            </div>
            <span className="text-slate-100 font-bold text-lg">Smart Trip Planner</span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          {[
            { icon: "✨", title: "AI-generated itineraries", desc: "Day-by-day plans built by AI, tailored to your pace and interests." },
            { icon: "🗺️", title: "Interactive maps", desc: "See your route come to life with pins, distances, and a live map view." },
            { icon: "💾", title: "Save & share trips", desc: "Keep all your trips in one place and share them with a single link." },
          ].map(f => (
            <div key={f.title} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-lg shrink-0">
                {f.icon}
              </div>
              <div>
                <p className="text-slate-100 font-semibold text-sm">{f.title}</p>
                <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="relative z-10 text-xs text-slate-700">
          Free · Open source · No credit card required
        </p>
      </div>

      {/* Right: Auth form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-lg">
            🧭
          </div>
          <span className="text-slate-100 font-bold">Smart Trip Planner</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-100">
              {tab === "login" ? "Welcome back" : "Create an account"}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {tab === "login"
                ? "Sign in to access your saved trips."
                : "Start planning your next adventure."}
            </p>
          </div>

          {/* Tab toggle */}
          <div className="flex bg-slate-800/60 border border-slate-700/60 rounded-xl p-1 mb-6 gap-1">
            {(["login", "signup"] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  tab === t
                    ? "bg-violet-600 text-white shadow-md shadow-violet-900/60"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {t === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "signup" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="Apoorv Mehrotra"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="8+ characters"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 text-xs text-red-400 bg-red-950/40 border border-red-800/40 rounded-xl px-4 py-3">
                <span className="mt-0.5 shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 active:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-900/40 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Please wait…</span>
                </>
              ) : tab === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-600 mt-8">
            <Link href="/" className="text-slate-500 hover:text-violet-400 transition-colors">
              ← Back to planner
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
