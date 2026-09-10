import { CalendarDays, Inbox, Megaphone, TriangleAlert } from "lucide-react";
import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/client";
import { TenantLayout } from "@/components/layout/TenantLayout";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export default async function TenantAnnouncementsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.TENANT) {
    redirect("/admin/dashboard");
  }

  const apartments = await prisma.apartment.findMany({
    where: {
      ownerId: session.id,
    },

    select: {
      id: true,
      associationId: true,
    },

    orderBy: {
      number: "asc",
    },
  });

  if (apartments.length === 0) {
    return (
      <TenantLayout
        title="Informații indisponibile"
        description="Contul tău nu este asociat momentan unui apartament."
      >
        <div className="mx-auto max-w-4xl">
          <div className="app-card relative overflow-hidden p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-400/[0.05] blur-3xl" />

            <div className="relative flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/[0.08] text-amber-300 ring-1 ring-amber-400/10">
                <TriangleAlert size={22} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-200">
                  Apartament indisponibil
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Contul tău nu este asociat niciunui apartament. Contactează
                  administratorul asociației pentru configurarea accesului.
                </p>
              </div>
            </div>
          </div>
        </div>
      </TenantLayout>
    );
  }

  const associationIds = [
    ...new Set(apartments.map((apartment) => apartment.associationId)),
  ];

  const announcements = await prisma.announcement.findMany({
    where: {
      associationId: {
        in: associationIds,
      },

      withdrawnAt: null,
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <TenantLayout title="Avizier virtual">
      <div className="mx-auto max-w-7xl space-y-8">
        <section>
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.7)]" />

              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                Community updates
              </p>
            </div>

            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-100">
              Anunțurile administratorului
            </h2>
          </div>
        </section>

        <section className="app-card overflow-hidden">
          <div className="border-b border-white/[0.07] px-6 py-5">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.65)]" />

              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400">
                Noticeboard feed
              </p>
            </div>

            <h2 className="mt-2 text-lg font-semibold text-slate-100">
              Listă anunțuri
            </h2>
          </div>

          {announcements.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-slate-500">
                <Inbox size={24} strokeWidth={1.7} />
              </div>

              <h3 className="mt-4 font-medium text-slate-300">
                Nu există anunțuri active
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Când administratorul publică o comunicare nouă pentru asociația
                ta, aceasta va apărea aici.
              </p>
            </div>
          ) : (
            <div className="space-y-4 p-5 sm:p-6">
              {announcements.map((announcement) => (
                <article
                  key={announcement.id}
                  className="group relative overflow-hidden rounded-[22px] border border-white/[0.065] bg-white/[0.018] transition duration-200 hover:border-violet-400/15 hover:bg-violet-500/[0.02]"
                >
                  <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-500/[0.04] blur-3xl" />

                  <div className="relative p-5 sm:p-6">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-violet-500/[0.08] text-violet-300 ring-1 ring-violet-400/10">
                        <Megaphone size={19} strokeWidth={1.8} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold tracking-[-0.025em] text-slate-100">
                          {announcement.title}
                        </h3>

                        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                          <CalendarDays size={13} />
                          Publicat{" "}
                          {announcement.createdAt.toLocaleDateString("ro-RO")}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-white/[0.055] bg-[#0b1220]/55 p-4 sm:p-5">
                      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-400">
                        {announcement.content}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </TenantLayout>
  );
}
