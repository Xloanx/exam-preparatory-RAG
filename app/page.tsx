"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../lib/api";

export default function Home() {
  const [status, setStatus] = useState<string>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.health()
      .then((res) => {
        if (!cancelled) setStatus(res.status);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 p-8">
      <h1 className="text-3xl font-bold text-white">ITF Exam Prep RAG</h1>
      <p className="mt-4 text-slate-400">Exam preparatory RAG app for ITF staff</p>

      <nav className="mt-6 flex gap-4">
        <Link href="/exam" className="rounded bg-slate-700 px-4 py-2 font-semibold text-white">
          Start Exam
        </Link>
        <Link href="/admin" className="rounded bg-slate-800 px-4 py-2 font-semibold text-slate-200">
          Admin
        </Link>
      </nav>

      <div className="mt-8 max-w-2xl rounded-lg border border-slate-700 bg-slate-900 p-4">
        {status === "loading" && <p className="text-slate-300">Checking backend health...</p>}
        {status === "ok" && <p className="text-emerald-400">Backend healthy</p>}
        {error && <p className="text-red-400">Backend unreachable: {error}</p>}
      </div>
    </main>
  );
}
