import { Building2, Layers3, Plus, Ruler, UsersRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export default async function AdminApartmentsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.ADMIN) {
    redirect("/locatar/dashboard");
  }

  const apartments = await prisma.apartment.findMany({
    where: {
      association: {
        adminId: session.id,
      },
    },
    include: {
      owner: true,
      association: true,
    },
    orderBy: [
      {
        floor: "asc",
      },
      {
        number: "asc",
      },
    ],
  });

  const totalResidents = apartments.reduce(
    (total, apartment) => total + apartment.numberOfResidents,
    0,
  );

  const totalSurface = apartments.reduce(
    (total, apartment) => total + Number(apartment.surface.toString()),
    0,
  );

  const associationCount = new Set(
    apartments.map((apartment) => apartment.associationId),
  ).size;

  return (
    <AdminLayout
      title="Apartamente si locatari"
      description="Gestioneaza apartamentele din asociatie si locatarii asociati."
    >
      <div className="mx-auto max-w-7xl space-y-8">
        <section>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.7)]" />

                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                  Portofoliu
                </p>
              </div>

              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-100">
                Situatia apartamentelor
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Imagine de ansamblu asupra unitatilor locative administrate.
              </p>
            </div>

            <Link
              href="/admin/apartamente/new"
              className="app-button-primary inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium"
            >
              <Plus size={17} strokeWidth={2} />
              Adauga apartament
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-violet-500/[0.08] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Apartamente
                  </p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {apartments.length}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Unitati administrate
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/10">
                  <Building2 size={20} strokeWidth={1.8} />
                </div>
              </div>
            </div>

            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-400/[0.07] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">Locatari</p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {totalResidents}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Persoane declarate
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/10">
                  <UsersRound size={20} strokeWidth={1.8} />
                </div>
              </div>
            </div>

            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-400/[0.07] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Suprafata totala
                  </p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {totalSurface.toFixed(2)}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">Metri patrati</p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-blue-400/10 text-blue-300 ring-1 ring-blue-400/10">
                  <Ruler size={20} strokeWidth={1.8} />
                </div>
              </div>
            </div>

            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-400/[0.06] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Asociatii
                  </p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {associationCount}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Cu apartamente active
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/10">
                  <Layers3 size={20} strokeWidth={1.8} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="app-card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-white/[0.07] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.65)]" />

                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400">
                  Registru
                </p>
              </div>

              <h2 className="mt-2 text-lg font-semibold text-slate-100">
                Lista apartamente
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Total apartamente: {apartments.length}
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs text-slate-500">
              <Building2 size={15} />
              Evidenta locativa
            </div>
          </div>

          {apartments.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-slate-500">
                <Building2 size={24} strokeWidth={1.7} />
              </div>

              <h3 className="mt-4 font-medium text-slate-300">
                Nu exista apartamente
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Adauga primul apartament pentru a incepe administrarea
                locatarilor si a datelor locative.
              </p>

              <Link
                href="/admin/apartamente/new"
                className="app-button-primary mt-5 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
              >
                <Plus size={16} />
                Adauga apartament
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.025]">
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Apartament
                    </th>

                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Etaj
                    </th>

                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Suprafata
                    </th>

                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Persoane
                    </th>

                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Locatar
                    </th>

                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Email
                    </th>

                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Asociatie
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.055]">
                  {apartments.map((apartment) => (
                    <tr
                      key={apartment.id}
                      className="transition-colors duration-150 hover:bg-violet-500/[0.035]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-xs font-semibold text-violet-300 ring-1 ring-violet-400/10">
                            {apartment.number}
                          </div>

                          <span className="font-medium text-slate-200">
                            Ap. {apartment.number}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-400">
                        {apartment.floor}
                      </td>

                      <td className="px-6 py-4 text-slate-400">
                        {apartment.surface.toString()} mp
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/10 bg-cyan-400/[0.06] px-2.5 py-1 text-xs font-medium text-cyan-300">
                          <UsersRound size={13} />
                          {apartment.numberOfResidents}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-300">
                          {apartment.owner.name}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-slate-500">
                        {apartment.owner.email}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-lg border border-white/[0.07] bg-white/[0.035] px-2.5 py-1 text-xs font-medium text-slate-400">
                          {apartment.association.name}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
