"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export default function AuthButton() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggleOpen() {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setOpen(o => !o);
  }

  if (status === "loading") {
    return <div className="w-9 h-9 rounded-full bg-white/[0.08] animate-pulse" />;
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
          onClick={toggleOpen}
          className="flex items-center gap-2 hover:bg-white/5 rounded-xl px-2 py-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          aria-label="User menu"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-sm font-bold text-white ring-2 ring-white/10 shadow-lg">
            {initials}
          </div>
          <svg
            className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div
            className="fixed w-56 bg-[#1a1a24] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-[9999]"
            style={{ top: pos.top, right: pos.right }}
            role="menu"
          >
            {/* User info header */}
            <div className="px-4 py-3.5 border-b border-white/5 bg-white/[0.03]">
              <p className="text-sm font-semibold text-zinc-100 truncate">{fullName}</p>
              <p className="text-xs text-zinc-500 truncate mt-0.5">{session.user.email}</p>
            </div>

            {/* Menu items */}
            <div className="py-1.5">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-zinc-100 transition-colors w-full text-left focus-visible:outline-none focus-visible:bg-white/[0.08]"
                role="menuitem"
              >
                <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-sm">✨</span>
                <span>New trip</span>
              </Link>
              <Link
                href="/history"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-zinc-100 transition-colors w-full text-left focus-visible:outline-none focus-visible:bg-white/[0.08]"
                role="menuitem"
              >
                <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-sm">🕓</span>
                <span>Saved trips</span>
              </Link>
            </div>

            <div className="border-t border-white/5 py-1.5">
              <button
                onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full text-left focus-visible:outline-none focus-visible:bg-white/[0.08]"
                role="menuitem"
              >
                <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-sm">→</span>
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
      className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white px-4 py-2 rounded-xl transition-all text-sm font-semibold shadow-lg shadow-violet-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111118]"
    >
      Sign in
    </Link>
  );
}
