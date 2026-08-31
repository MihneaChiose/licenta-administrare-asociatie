import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Gauge,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070b14] px-5 py-12 text-slate-100">
      <div className="pointer-events-none absolute left-[-140px] top-[-120px] h-[420px] w-[420px] rounded-full bg-violet-600/[0.11] blur-[120px]" />

      <div className="pointer-events-none absolute bottom-[-160px] right-[-100px] h-[460px] w-[460px] rounded-full bg-cyan-500/[0.08] blur-[130px]" />

      <div className="relative w-full max-w-5xl">
        <div className="overflow-hidden rounded-[30px] border border-white/[0.075] bg-white/[0.025] shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <section className="relative overflow-hidden border-b border-white/[0.06] p-7 sm:p-10 lg:border-b-0 lg:border-r">
              <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-violet-500/[0.07] blur-3xl" />

              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-xl border border-violet-400/10 bg-violet-500/[0.05] px-3 py-2 text-xs font-medium text-violet-300">
                  <Sparkles size={14} />
                  Platformă digitală pentru asociații
                </div>

                <div className="mt-8 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-violet-500/20 to-cyan-400/10 text-violet-200 ring-1 ring-violet-400/15">
                    <Building2 size={26} />
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Administrare Asociație
                    </p>

                    <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-slate-50 sm:text-4xl">
                      Administrare simplă.
                      <br />
                      Informații clare.
                    </h1>
                  </div>
                </div>

                <p className="mt-7 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
                  Platformă digitală pentru administratori și locatari, cu acces
                  centralizat la întreținere, plăți, indexuri, sesizări și
                  comunicările asociației.
                </p>

                <Link
                  href="/login"
                  className="app-button-primary mt-8 inline-flex items-center gap-2 px-5 py-3 text-sm font-medium"
                >
                  Accesează platforma
                  <ArrowRight size={16} />
                </Link>
              </div>
            </section>

            <section className="relative p-7 sm:p-10">
              <div className="pointer-events-none absolute -right-16 top-10 h-52 w-52 rounded-full bg-cyan-400/[0.045] blur-3xl" />

              <div className="relative">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400">
                  Digital property management
                </p>

                <h2 className="mt-2 text-lg font-semibold text-slate-200">
                  Tot ce ai nevoie într-un singur loc
                </h2>

                <div className="mt-7 space-y-3">
                  <div className="flex items-start gap-3 rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/[0.08] text-violet-300 ring-1 ring-violet-400/10">
                      <Gauge size={16} />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-300">
                        Indexuri și consumuri
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Evidență lunară și istoric centralizat.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/[0.07] text-cyan-300 ring-1 ring-cyan-400/10">
                      <Building2 size={16} />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-300">
                        Întreținere și administrare
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Calcul, transparență și acces la situația financiară.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/[0.07] text-emerald-300 ring-1 ring-emerald-400/10">
                      <ShieldCheck size={16} />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-300">
                        Acces pe roluri
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Experiențe separate pentru administrator și locatar.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-slate-700">
          Administrare Asociație · platformă digitală
        </p>
      </div>
    </main>
  );
}
