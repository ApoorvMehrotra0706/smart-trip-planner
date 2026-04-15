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
      style={{
        background: "radial-gradient(ellipse 90% 60% at 50% -5%, #3b1580 0%, #120c30 40%, #08071a 75%)"
      }}
    >
      <div className="w-full" style={{ maxWidth: 480 }}>

        {/* Logo */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-[60px] h-[60px] rounded-[18px] text-[28px] mb-5"
            style={{
              background: "linear-gradient(145deg, #8b5cf6, #6d28d9)",
              boxShadow: "0 0 0 1px rgba(139,92,246,0.4), 0 8px 40px rgba(109,40,217,0.5)"
            }}
            aria-hidden="true"
          >
            🧭
          </div>
          <h1 className="text-[24px] font-bold text-white tracking-tight">Smart Trip Planner</h1>
          <p className="text-zinc-500 text-sm mt-2">Plan your next adventure with AI</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl"
          style={{
            background: "linear-gradient(180deg, #1c1c3a 0%, #161630 100%)",
            border: "1px solid rgba(139,92,246,0.2)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset"
          }}
        >
          {/* Tab switcher */}
          <div
            className="flex m-5 mb-0 rounded-xl p-1 gap-1"
            style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            {(["login", "signup"] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); }}
                className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                  tab === t
                    ? "text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
                style={tab === t ? {
                  background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                  boxShadow: "0 2px 12px rgba(124,58,237,0.5)"
                } : {}}
              >
                {t === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {/* Form */}
          <div style={{ padding: "28px 32px 32px" }}>
            <form onSubmit={handleSubmit} noValidate>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {tab === "signup" && (
                  <div>
                    <label
                      htmlFor="name"
                      style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#a1a1b5", marginBottom: 8, letterSpacing: "0.04em" }}
                    >
                      FULL NAME
                    </label>
                    <input
                      id="name" type="text" value={name}
                      onChange={e => setName(e.target.value)}
                      required placeholder="Your name" autoComplete="name"
                      style={{
                        width: "100%", boxSizing: "border-box", borderRadius: 12,
                        padding: "13px 16px", fontSize: 14, color: "#f4f4f6",
                        background: "#0c0c20", border: "1px solid rgba(255,255,255,0.18)",
                        outline: "none", transition: "all 0.15s",
                        fontFamily: "inherit"
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = "#8b5cf6";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.2)";
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email"
                    style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#a1a1b5", marginBottom: 8, letterSpacing: "0.04em" }}
                  >
                    EMAIL ADDRESS
                  </label>
                  <input
                    id="email" type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    required placeholder="you@example.com" autoComplete="email"
                    style={{
                      width: "100%", boxSizing: "border-box", borderRadius: 12,
                      padding: "13px 16px", fontSize: 14, color: "#f4f4f6",
                      background: "#0c0c20", border: "1px solid rgba(255,255,255,0.18)",
                      outline: "none", transition: "all 0.15s",
                      fontFamily: "inherit"
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = "#8b5cf6";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.2)";
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#a1a1b5", marginBottom: 8, letterSpacing: "0.04em" }}
                  >
                    PASSWORD
                  </label>
                  <input
                    id="password" type="password" value={password}
                    onChange={e => setPassword(e.target.value)}
                    required minLength={8} placeholder="8+ characters"
                    autoComplete={tab === "login" ? "current-password" : "new-password"}
                    style={{
                      width: "100%", boxSizing: "border-box", borderRadius: 12,
                      padding: "13px 16px", fontSize: 14, color: "#f4f4f6",
                      background: "#0c0c20", border: "1px solid rgba(255,255,255,0.18)",
                      outline: "none", transition: "all 0.15s",
                      fontFamily: "inherit"
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = "#8b5cf6";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.2)";
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                {error && (
                  <div
                    role="alert" aria-live="polite"
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      background: "rgba(127,29,29,0.4)", border: "1px solid rgba(185,28,28,0.5)",
                      borderRadius: 12, padding: "12px 16px"
                    }}
                  >
                    <span style={{ color: "#f87171", flexShrink: 0, marginTop: 1 }} aria-hidden="true">⚠</span>
                    <p style={{ fontSize: 12, color: "#f87171", lineHeight: 1.5 }}>{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2.5 font-semibold text-white rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
                  style={{
                    width: "100%", padding: "14px 24px", fontSize: 15,
                    background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                    boxShadow: "0 4px 24px rgba(124,58,237,0.45)"
                  }}
                  onMouseEnter={e => !loading && (e.currentTarget.style.background = "linear-gradient(135deg, #8b5cf6, #7c3aed)")}
                  onMouseLeave={e => !loading && (e.currentTarget.style.background = "linear-gradient(135deg, #7c3aed, #5b21b6)")}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                      Please wait…
                    </>
                  ) : (
                    tab === "login" ? "Sign in →" : "Create account →"
                  )}
                </button>

              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-8 mt-8">
          {[{ icon: "✨", label: "AI itineraries" }, { icon: "🗺️", label: "Live maps" }, { icon: "💾", label: "Save & share" }].map(f => (
            <div key={f.label} className="flex items-center gap-2">
              <span className="text-sm" aria-hidden="true">{f.icon}</span>
              <span className="text-xs text-zinc-600">{f.label}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-zinc-700 mt-5">
          <Link href="/" className="hover:text-violet-400 transition-colors">← Back to planner</Link>
        </p>

      </div>
    </div>
  );
}
