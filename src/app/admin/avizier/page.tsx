import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Inbox,
  Megaphone,
  Radio,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { CreateAnnouncementForm } from "./CreateAnnouncementForm";
import { EditAnnouncementForm } from "./EditAnnouncementForm";
import { WithdrawAnnouncementButton } from "./WithdrawAnnouncementButton";

type AdminAnnouncementsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function AdminAnnouncementsPage({
  searchParams,
}: AdminAnnouncementsPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.ADMIN) {
    redirect("/locatar/dashboard");
  }

  const params = await searchParams;

  const associations = await prisma.association.findMany({
    where: {
      adminId: session.id,
    },

    select: {
      id: true,
      name: true,
    },

    orderBy: {
      name: "asc",
    },
  });

  const announcements = await prisma.announcement.findMany({
    where: {
      association: {
        adminId: session.id,
      },
    },

    include: {
      association: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  const activeAnnouncements = announcements.filter(
    (announcement) => announcement.withdrawnAt === null,
  );

  const withdrawnAnnouncements = announcements.filter(
    (announcement) => announcement.withdrawnAt !== null,
  );

  return (
    <AdminLayout
      title="Avizier virtual"
      description="Publică și administrează anunțurile vizibile pentru locatarii din asociațiile administrate."
    >
      <div className="mx-auto max-w-7xl space-y-8">
        {params.error && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-400/15 bg-rose-500/[0.08] p-4 text-sm text-rose-300">
            <TriangleAlert size={18} className="mt-0.5 shrink-0" />

            <p>{params.error}</p>
          </div>
        )}

        {params.success && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-400/15 bg-emerald-500/[0.08] p-4 text-sm text-emerald-300">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />

            <p>{params.success}</p>
          </div>
        )}

        <section>
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.7)]" />

              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                Community communications
              </p>
            </div>

            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-100">
              Comunicare cu locatarii
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Publică informații importante și gestionează istoricul
              comunicărilor asociației.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-violet-500/[0.08] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Total anunțuri
                  </p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {announcements.length}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">Istoric complet</p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/10">
                  <Megaphone size={20} strokeWidth={1.8} />
                </div>
              </div>
            </div>

            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-400/[0.06] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">Active</p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {activeAnnouncements.length}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Vizibile locatarilor
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/10">
                  <Radio size={20} strokeWidth={1.8} />
                </div>
              </div>
            </div>

            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-slate-400/[0.05] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">Retrase</p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {withdrawnAnnouncements.length}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Păstrate în istoric
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-slate-400/[0.08] text-slate-400 ring-1 ring-white/[0.05]">
                  <XCircle size={20} strokeWidth={1.8} />
                </div>
              </div>
            </div>

            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-400/[0.06] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Asociații
                  </p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {associations.length}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Disponibile pentru publicare
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/10">
                  <Building2 size={20} strokeWidth={1.8} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[0.78fr_1.55fr]">
          <section className="app-card relative h-fit overflow-hidden">
            <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-violet-500/[0.055] blur-3xl" />

            <div className="relative border-b border-white/[0.07] px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/10">
                  <Megaphone size={19} />
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                    Publicare
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-slate-100">
                    Publică anunț
                  </h2>
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Selectează asociația și completează informațiile pe care vrei să
                le comunici locatarilor.
              </p>
            </div>

            <div className="relative p-6">
              {associations.length === 0 ? (
                <div className="flex items-start gap-3 rounded-xl border border-amber-400/15 bg-amber-400/[0.06] p-4 text-sm text-amber-300">
                  <TriangleAlert size={18} className="mt-0.5 shrink-0" />

                  <div>
                    <p className="font-medium">
                      Nu există asociații disponibile
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Contul curent nu administrează nicio asociație în care să
                      poată publica anunțuri.
                    </p>
                  </div>
                </div>
              ) : (
                <CreateAnnouncementForm associations={associations} />
              )}
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
                  Anunțuri publicate
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Total anunțuri: {announcements.length}
                </p>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] px-3 py-2 text-xs text-emerald-300">
                <Radio size={14} />
                {activeAnnouncements.length} active
              </div>
            </div>

            {announcements.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-slate-500">
                  <Inbox size={24} strokeWidth={1.7} />
                </div>

                <h3 className="mt-4 font-medium text-slate-300">
                  Nu există anunțuri publicate
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Folosește formularul de publicare pentru a crea primul mesaj
                  destinat locatarilor.
                </p>
              </div>
            ) : (
              <div className="space-y-4 p-5 sm:p-6">
                {announcements.map((announcement) => {
                  const isWithdrawn = announcement.withdrawnAt !== null;

                  return (
                    <article
                      key={announcement.id}
                      className={`group relative overflow-hidden rounded-[20px] border transition duration-200 ${
                        isWithdrawn
                          ? "border-white/[0.045] bg-white/[0.012] opacity-75"
                          : "border-white/[0.065] bg-white/[0.02] hover:border-violet-400/15 hover:bg-violet-500/[0.022]"
                      }`}
                    >
                      {!isWithdrawn && (
                        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-violet-500/[0.04] blur-3xl" />
                      )}

                      <div className="relative p-5 sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] ring-1 ${
                                  isWithdrawn
                                    ? "bg-slate-400/[0.06] text-slate-500 ring-white/[0.04]"
                                    : "bg-violet-500/[0.08] text-violet-300 ring-violet-400/10"
                                }`}
                              >
                                <Megaphone size={17} />
                              </div>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2.5">
                                  <h3
                                    className={`text-lg font-semibold tracking-[-0.025em] ${
                                      isWithdrawn
                                        ? "text-slate-400"
                                        : "text-slate-100"
                                    }`}
                                  >
                                    {announcement.title}
                                  </h3>

                                  <span
                                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
                                      isWithdrawn
                                        ? "border-slate-400/10 bg-slate-400/[0.05] text-slate-500"
                                        : "border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300"
                                    }`}
                                  >
                                    {isWithdrawn ? (
                                      <>
                                        <XCircle size={12} />
                                        Retras
                                      </>
                                    ) : (
                                      <>
                                        <Radio size={12} />
                                        Activ
                                      </>
                                    )}
                                  </span>
                                </div>

                                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                                  <div className="flex items-center gap-1.5">
                                    <Building2 size={13} />

                                    <span>{announcement.association.name}</span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <CalendarDays size={13} />

                                    <span>
                                      Publicat{" "}
                                      {announcement.createdAt.toLocaleDateString(
                                        "ro-RO",
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`mt-5 rounded-2xl border p-4 ${
                            isWithdrawn
                              ? "border-white/[0.04] bg-white/[0.012]"
                              : "border-white/[0.055] bg-[#0b1220]/55"
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-400">
                            {announcement.content}
                          </p>
                        </div>

                        {announcement.withdrawnAt && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                            <XCircle size={13} />
                            Retras la{" "}
                            {announcement.withdrawnAt.toLocaleDateString(
                              "ro-RO",
                            )}
                          </div>
                        )}

                        {!isWithdrawn && (
                          <div className="mt-5 border-t border-white/[0.055] pt-4">
                            <div className="flex flex-wrap gap-2">
                              <EditAnnouncementForm
                                announcementId={announcement.id}
                                initialTitle={announcement.title}
                                initialContent={announcement.content}
                              />

                              <WithdrawAnnouncementButton
                                announcementId={announcement.id}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
