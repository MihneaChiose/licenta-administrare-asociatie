import {
  Building2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { loginAction } from "./actions";
import Link from "next/link";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070b14] px-4 py-10 text-slate-100">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-violet-600/15 blur-[110px]" />

      <div className="pointer-events-none absolute -bottom-48 -right-32 h-[500px] w-[500px] rounded-full bg-cyan-400/[0.08] blur-[120px]" />

      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.025) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/[0.075] bg-[#0d1424]/80 shadow-[0_40px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden border-r border-white/[0.06] p-12 lg:flex lg:flex-col lg:justify-between">
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-[0_12px_35px_rgba(118,103,247,0.28)]">
                <Building2 size={24} strokeWidth={1.8} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white">
                    Administrare Asociatie
                  </p>

                  <Sparkles size={14} className="text-violet-300" />
                </div>

                <p className="mt-0.5 text-xs uppercase tracking-[0.18em] text-slate-600">
                  Smart property management
                </p>
              </div>
            </div>

            <h1 className="mt-14 max-w-md text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-white">
              Administrarea asociației,
              <span className="block bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
                simplificată digital.
              </span>
            </h1>
          </div>

          <div className="relative flex items-center gap-3 text-xs text-slate-500">
            <ShieldCheck size={17} className="text-violet-400" />

            <span>Acces securizat</span>
          </div>
        </section>

        <section className="p-7 sm:p-10 lg:p-12">
          <div className="mx-auto max-w-sm">
            <div className="lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400">
                <Building2 size={21} />
              </div>
            </div>

            <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-400 lg:mt-0">
              Bine ai revenit
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">
              Autentificare
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Intra in cont pentru a accesa platforma.
            </p>

            {params.error && (
              <div className="mt-6 rounded-xl border border-rose-400/15 bg-rose-500/[0.09] p-4 text-sm text-rose-300">
                {params.error}
              </div>
            )}

            {params.success && (
              <div className="mt-6 rounded-xl border border-emerald-400/15 bg-emerald-500/[0.08] p-4 text-sm text-emerald-300">
                {params.success}
              </div>
            )}

            <form action={loginAction} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-300"
                >
                  Email
                </label>

                <div className="relative mt-2">
                  <Mail
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="app-input py-3 pl-11 pr-4"
                    placeholder="email@exemplu.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-300"
                >
                  Parola
                </label>

                <div className="relative mt-2">
                  <LockKeyhole
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                  />

                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="app-input py-3 pl-11 pr-4"
                    placeholder="Introdu parola"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="app-button-primary w-full px-4 py-3 font-medium"
              >
                Intra in cont
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-500">
              Nu ai cont de administrator?{" "}
              <Link
                href="/register"
                className="font-medium text-violet-300 transition hover:text-violet-200"
              >
                Creează cont
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
