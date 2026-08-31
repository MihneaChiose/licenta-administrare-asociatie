import {
  Building2,
  CalendarDays,
  Inbox,
  Megaphone,
  Radio,
  TriangleAlert,
} from "lucide-react";
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

    include: {
      association: true,
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

    include: {
      association: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  const latestAnnouncement = announcements[0];

  const latestAnnouncementDate = latestAnnouncement
    ? latestAnnouncement.createdAt.toLocaleDateString("ro-RO")
    : "-";

  return (
    <TenantLayout
      title="Avizier virtual"
      description="Anunțurile asociațiilor din care fac parte apartamentele tale."
    >
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
              Avizierul meu
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Urmărește informațiile și comunicările publicate de administrația
              asociației.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-violet-500/[0.08] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Anunțuri active
                  </p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {announcements.length}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Vizibile în avizier
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/10">
                  <Megaphone size={20} strokeWidth={1.8} />
                </div>
              </div>
            </div>

            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-400/[0.07] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Asociații
                  </p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {associationIds.length}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Surse de comunicare
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/10">
                  <Building2 size={20} strokeWidth={1.8} />
                </div>
              </div>
            </div>

            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-400/[0.06] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Ultima publicare
                  </p>

                  <p className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-50">
                    {latestAnnouncementDate}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Cel mai recent anunț
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/10">
                  <CalendarDays size={20} strokeWidth={1.8} />
                </div>
              </div>
            </div>

            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-400/[0.07] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Apartamente
                  </p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {apartments.length}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Asociate contului tău
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-blue-400/10 text-blue-300 ring-1 ring-blue-400/10">
                  <Building2 size={20} strokeWidth={1.8} />
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
                  Noticeboard feed
                </p>
              </div>

              <h2 className="mt-2 text-lg font-semibold text-slate-100">
                Anunțuri recente
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Comunicările active publicate pentru asociațiile tale.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] px-3 py-2 text-xs text-emerald-300">
              <Radio size={14} />
              {announcements.length} active
            </div>
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
              {announcements.map((announcement, index) => (
                <article
                  key={announcement.id}
                  className="group relative overflow-hidden rounded-[22px] border border-white/[0.065] bg-white/[0.018] transition duration-200 hover:border-violet-400/15 hover:bg-violet-500/[0.02]"
                >
                  <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-500/[0.04] blur-3xl" />

                  <div className="relative p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-violet-500/[0.08] text-violet-300 ring-1 ring-violet-400/10">
                          <Megaphone size={19} strokeWidth={1.8} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h3 className="text-lg font-semibold tracking-[-0.025em] text-slate-100">
                              {announcement.title}
                            </h3>

                            {index === 0 && (
                              <span className="rounded-lg border border-violet-400/10 bg-violet-500/[0.06] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-violet-300">
                                Recent
                              </span>
                            )}

                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/15 bg-emerald-400/[0.07] px-2.5 py-1 text-xs font-medium text-emerald-300">
                              <Radio size={11} />
                              Activ
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <Building2 size={13} />

                              {announcement.association.name}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <CalendarDays size={13} />
                              Publicat{" "}
                              {announcement.createdAt.toLocaleDateString(
                                "ro-RO",
                              )}
                            </div>
                          </div>
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
