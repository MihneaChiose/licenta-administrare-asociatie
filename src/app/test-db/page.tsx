import { CheckCircle2, Database, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function TestDbPage() {
  const users = await prisma.user.findMany();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070b14] px-5 py-12 text-slate-100">
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-500/[0.08] blur-[100px]" />

      <div className="app-card relative w-full max-w-xl overflow-hidden p-7 sm:p-8">
        <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-cyan-400/[0.05] blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/10">
              <Database size={20} />
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                System diagnostic
              </p>

              <h1 className="mt-1 text-xl font-semibold text-slate-100">
                Test bază de date
              </h1>
            </div>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Utilizatori</p>

                <Users size={17} className="text-cyan-300" />
              </div>

              <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-100">
                {users.length}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.035] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Conexiune</p>

                <CheckCircle2 size={17} className="text-emerald-300" />
              </div>

              <p className="mt-3 text-sm font-medium text-emerald-300">
                Baza de date răspunde
              </p>
            </div>
          </div>

          <p className="mt-5 text-xs leading-5 text-slate-600">
            Această pagină este destinată verificării tehnice a conexiunii cu
            baza de date.
          </p>
        </div>
      </div>
    </main>
  );
}
