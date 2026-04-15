"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export default function AuthButton() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (status === "loading") {
    return <div className="w-9 h-9 rounded-full bg-slate-700 animate-pulse" />;
  }

  if (session?.user) {
    const fullName = session.user.name ?? session.user.email ?? "User";
    const initials = fullName
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 hover:bg-slate-800 rounded-xl px-2 py-1.5 transition-all"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-sm font-bold text-white shrink-0 ring-2 ring-violet-500/30 shadow-lg shadow-violet-900/40">
            {initials}
          </div>
          <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-50">
            {/* User info header */}
            <div className="px-4 py-3 border-b border-slate-800">
              <p className="text-sm font-semibold text-slate-100 truncate">{fullName}</p>
              <p className="text-xs text-slate-500 truncate mt-0.5">{session.user.email}</p>
            </div>

            {/* Menu items */}
            <div className="py-1.5">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <span className="text-base">✨</span>
                <span>New trip</span>
              </Link>
              <Link
                href="/history"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <span className="text-base">🕓</span>
                <span>Saved trips</span>
              </Link>
            </div>

            <div className="border-t border-slate-800 py-1.5">
              <button
                onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
              >
                <span className="text-base">→</span>
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white px-4 py-2 rounded-xl transition-all text-sm font-semibold shadow-lg shadow-violet-900/40"
    >
      Sign in
    </Link>
  );
}
