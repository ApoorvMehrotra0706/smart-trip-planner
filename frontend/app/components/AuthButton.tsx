"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="w-7 h-7 rounded-full bg-slate-700 animate-pulse" />;
  }

  if (session?.user) {
    const fullName = session.user.name ?? session.user.email ?? "User";
    const initials = fullName
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const firstName = fullName.split(" ")[0];

    return (
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-sm font-bold text-white shrink-0 ring-2 ring-violet-500/30 shadow-lg shadow-violet-900/40">
          {initials}
        </div>
        <span className="text-sm text-slate-200 font-medium max-w-[90px] truncate">{firstName}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-xs text-slate-500 hover:text-red-400 hover:bg-red-900/20 px-2.5 py-1.5 rounded-lg transition-all border border-slate-700 hover:border-red-800/50"
        >
          Sign out
        </button>
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
