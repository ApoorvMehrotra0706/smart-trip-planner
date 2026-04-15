"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="w-7 h-7 rounded-full bg-slate-700 animate-pulse" />;
  }

  if (session?.user) {
    const initials = (session.user.name ?? session.user.email ?? "?")
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
          {initials}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-xs text-slate-400 hover:text-red-400 transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
    >
      Sign in
    </Link>
  );
}
