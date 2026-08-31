import {
  ArrowLeft,
  Building2,
  Info,
  Mail,
  Save,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { getSession } from "@/lib/session";
import { createApartmentAction } from "./actions";

type NewApartmentPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewApartmentPage({
  searchParams,
}: NewApartmentPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.ADMIN) {
    redirect("/locatar/dashboard");
  }

  const params = await searchParams;

  return (
    <AdminLayout
      title="Adauga apartament"
      description="Creeaza un locatar nou si asociaza-l unui apartament din asociatia administrata."
    >
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin/apartamente"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-violet-300"
        >
          <ArrowLeft size={16} />
          Inapoi la apartamente
        </Link>

        <div className="app-card relative mt-6 overflow-hidden">
          <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-violet-500/[0.07] blur-3xl" />

          <div className="relative border-b border-white/[0.07] px-6 py-6 sm:px-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-400/[0.08] text-violet-300 ring-1 ring-violet-400/10">
                <Building2 size={22} strokeWidth={1.8} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.7)]" />

                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                    Inregistrare noua
                  </p>
                </div>

                <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-100">
                  Date apartament si locatar
                </h2>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  Completeaza informatiile necesare pentru crearea contului de
                  locatar si inregistrarea apartamentului.
                </p>
              </div>
            </div>
          </div>

          <div className="relative p-6 sm:p-8">
            {params.error && (
              <div className="mb-7 flex items-start gap-3 rounded-xl border border-rose-400/15 bg-rose-500/[0.08] p-4 text-sm text-rose-300">
                <Info size={18} className="mt-0.5 shrink-0" />

                <p>{params.error}</p>
              </div>
            )}

            <form action={createApartmentAction} className="space-y-9">
              <section>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/[0.08] text-cyan-300 ring-1 ring-cyan-400/10">
                    <UserRound size={17} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-200">
                      Date locatar
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Informatii pentru contul noului locatar.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="tenantName"
                      className="text-sm font-medium text-slate-300"
                    >
                      Nume locatar
                    </label>

                    <div className="relative mt-2">
                      <UserRound
                        size={17}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                      />

                      <input
                        id="tenantName"
                        name="tenantName"
                        type="text"
                        required
                        className="app-input py-3 pl-11 pr-4"
                        placeholder="Ex: Popescu Andrei"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="tenantEmail"
                      className="text-sm font-medium text-slate-300"
                    >
                      Email locatar
                    </label>

                    <div className="relative mt-2">
                      <Mail
                        size={17}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"
                      />

                      <input
                        id="tenantEmail"
                        name="tenantEmail"
                        type="email"
                        required
                        className="app-input py-3 pl-11 pr-4"
                        placeholder="locatar@email.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-400/10 bg-blue-400/[0.045] p-4">
                  <Info size={17} className="mt-0.5 shrink-0 text-blue-300" />

                  <p className="text-sm leading-6 text-slate-400">
                    Parola initiala pentru locatar va fi{" "}
                    <span className="font-semibold text-slate-200">
                      locatar123
                    </span>
                    .
                  </p>
                </div>
              </section>

              <div className="h-px bg-white/[0.07]" />

              <section>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/10">
                    <Building2 size={17} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-200">
                      Date apartament
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Informatii locative si numarul de persoane declarate.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="apartmentNumber"
                      className="text-sm font-medium text-slate-300"
                    >
                      Numar apartament
                    </label>

                    <input
                      id="apartmentNumber"
                      name="apartmentNumber"
                      type="text"
                      required
                      className="app-input mt-2 px-4 py-3"
                      placeholder="Ex: 12"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="floor"
                      className="text-sm font-medium text-slate-300"
                    >
                      Etaj
                    </label>

                    <input
                      id="floor"
                      name="floor"
                      type="number"
                      required
                      className="app-input mt-2 px-4 py-3"
                      placeholder="Ex: 3"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="surface"
                      className="text-sm font-medium text-slate-300"
                    >
                      Suprafata mp
                    </label>

                    <input
                      id="surface"
                      name="surface"
                      type="number"
                      step="0.01"
                      required
                      className="app-input mt-2 px-4 py-3"
                      placeholder="Ex: 55.5"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="numberOfResidents"
                      className="text-sm font-medium text-slate-300"
                    >
                      Numar persoane
                    </label>

                    <input
                      id="numberOfResidents"
                      name="numberOfResidents"
                      type="number"
                      min="1"
                      required
                      className="app-input mt-2 px-4 py-3"
                      placeholder="Ex: 2"
                    />
                  </div>
                </div>
              </section>

              <div className="flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-center sm:justify-end">
                <Link
                  href="/admin/apartamente"
                  className="app-button-secondary inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium"
                >
                  Anuleaza
                </Link>

                <button
                  type="submit"
                  className="app-button-primary inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium"
                >
                  <Save size={17} />
                  Salveaza apartamentul
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
