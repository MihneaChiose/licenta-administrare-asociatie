import {
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock3,
  Inbox,
  LifeBuoy,
  MessageSquarePlus,
  MessageSquareText,
  Send,
  TriangleAlert,
} from "lucide-react";
import { redirect } from "next/navigation";
import { TicketStatus, UserRole } from "@/generated/prisma/client";
import { TenantLayout } from "@/components/layout/TenantLayout";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { createTicketAction } from "./actions";

type TenantTicketsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

const ticketStatusLabels: Record<TicketStatus, string> = {
  OPEN: "Deschisă",
  IN_PROGRESS: "În lucru",
  RESOLVED: "Rezolvată",
};

function getStatusClass(status: TicketStatus) {
  if (status === TicketStatus.RESOLVED) {
    return "border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300";
  }

  if (status === TicketStatus.IN_PROGRESS) {
    return "border-amber-400/15 bg-amber-400/[0.07] text-amber-300";
  }

  return "border-blue-400/15 bg-blue-400/[0.07] text-blue-300";
}

function getStatusIcon(status: TicketStatus) {
  if (status === TicketStatus.RESOLVED) {
    return CheckCircle2;
  }

  if (status === TicketStatus.IN_PROGRESS) {
    return Clock3;
  }

  return CircleDot;
}

function getTicketStep(status: TicketStatus) {
  if (status === TicketStatus.RESOLVED) {
    return 3;
  }

  if (status === TicketStatus.IN_PROGRESS) {
    return 2;
  }

  return 1;
}

const progressSteps = [
  {
    step: 1,
    label: "Deschisă",
  },
  {
    step: 2,
    label: "În lucru",
  },
  {
    step: 3,
    label: "Rezolvată",
  },
];

export default async function TenantTicketsPage({
  searchParams,
}: TenantTicketsPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.TENANT) {
    redirect("/admin/dashboard");
  }

  const params = await searchParams;

  const apartments = await prisma.apartment.findMany({
    where: {
      ownerId: session.id,
    },

    select: {
      id: true,
    },

    orderBy: {
      number: "asc",
    },
  });

  if (apartments.length === 0) {
    return (
      <TenantLayout title="Sesizări">
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
                  Nu există niciun apartament asociat contului tău. Contactează
                  administratorul pentru configurarea accesului.
                </p>
              </div>
            </div>
          </div>
        </div>
      </TenantLayout>
    );
  }

  const apartmentIds = apartments.map((apartment) => apartment.id);

  const tickets = await prisma.ticket.findMany({
    where: {
      apartmentId: {
        in: apartmentIds,
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  const openTickets = tickets.filter(
    (ticket) => ticket.status === TicketStatus.OPEN,
  );

  const inProgressTickets = tickets.filter(
    (ticket) => ticket.status === TicketStatus.IN_PROGRESS,
  );

  const resolvedTickets = tickets.filter(
    (ticket) => ticket.status === TicketStatus.RESOLVED,
  );

  const finishedTickets = resolvedTickets.length;

  return (
    <TenantLayout title="Sesizări">
      <div className="mx-auto max-w-7xl space-y-8">
        {params.error && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-400/15 bg-rose-500/[0.08] p-4 text-sm leading-6 text-rose-300">
            <TriangleAlert size={18} className="mt-0.5 shrink-0" />

            <p>{params.error}</p>
          </div>
        )}

        {params.success && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-400/15 bg-emerald-500/[0.08] p-4 text-sm leading-6 text-emerald-300">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />

            <p>{params.success}</p>
          </div>
        )}

        <section>
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.7)]" />

              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                Resident support
              </p>
            </div>

            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-100">
              Sesizările mele
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-violet-500/[0.08] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Total sesizări
                  </p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {tickets.length}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Solicitări transmise
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/10">
                  <Inbox size={20} strokeWidth={1.8} />
                </div>
              </div>
            </div>

            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-400/[0.07] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">Deschise</p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {openTickets.length}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Așteaptă preluarea
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-blue-400/10 text-blue-300 ring-1 ring-blue-400/10">
                  <CircleDot size={20} strokeWidth={1.8} />
                </div>
              </div>
            </div>

            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-400/[0.06] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">În lucru</p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {inProgressTickets.length}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Preluate de administrator
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/10">
                  <Clock3 size={20} strokeWidth={1.8} />
                </div>
              </div>
            </div>

            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-400/[0.06] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Finalizate
                  </p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {finishedTickets}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">Rezolvate</p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/10">
                  <CheckCircle2 size={20} strokeWidth={1.8} />
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
                  <MessageSquarePlus size={19} />
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                    Sesizare nouă
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-slate-100">
                    Trimite sesizare
                  </h2>
                </div>
              </div>
            </div>

            <div className="relative p-6">
              <form action={createTicketAction} className="space-y-5">
                <div>
                  <label
                    htmlFor="title"
                    className="text-sm font-medium text-slate-300"
                  >
                    Titlu
                  </label>

                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    minLength={3}
                    maxLength={100}
                    placeholder="Ex: Bec ars pe scară"
                    className="app-input mt-2 px-3 py-3"
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="text-sm font-medium text-slate-300"
                  >
                    Descriere
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    required
                    minLength={10}
                    maxLength={1000}
                    rows={7}
                    placeholder="Descrie problema observată..."
                    className="app-input mt-2 resize-none px-3 py-3 leading-6"
                  />

                  <p className="mt-1.5 text-xs text-slate-600">
                    Maximum 1000 de caractere.
                  </p>
                </div>

                <button
                  type="submit"
                  className="app-button-primary inline-flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-medium"
                >
                  <Send size={17} />
                  Trimite sesizarea
                </button>
              </form>
            </div>
          </section>

          <section className="app-card overflow-hidden">
            <div className="border-b border-white/[0.07] px-6 py-5">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.65)]" />

                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400">
                  Support history
                </p>
              </div>

              <h2 className="mt-2 text-lg font-semibold text-slate-100">
                Istoric
              </h2>
            </div>

            {tickets.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-slate-500">
                  <LifeBuoy size={24} strokeWidth={1.7} />
                </div>

                <h3 className="mt-4 font-medium text-slate-300">
                  Nu ai trimis încă nicio sesizare
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Sesizările tale vor apărea aici și vei putea urmări progresul
                  lor în timp.
                </p>
              </div>
            ) : (
              <div className="space-y-4 p-5 sm:p-6">
                {tickets.map((ticket) => {
                  const StatusIcon = getStatusIcon(ticket.status);

                  const currentStep = getTicketStep(ticket.status);

                  return (
                    <article
                      key={ticket.id}
                      className="group relative overflow-hidden rounded-[20px] border border-white/[0.065] bg-white/[0.018] transition duration-200 hover:border-violet-400/15 hover:bg-violet-500/[0.02]"
                    >
                      <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-violet-500/[0.035] blur-3xl" />

                      <div className="relative p-5 sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-violet-500/[0.08] text-violet-300 ring-1 ring-violet-400/10">
                              <MessageSquareText size={17} />
                            </div>

                            <div className="min-w-0">
                              <h3 className="text-lg font-semibold tracking-[-0.025em] text-slate-100">
                                {ticket.title}
                              </h3>

                              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                                <CalendarDays size={13} />
                                Trimisă{" "}
                                {ticket.createdAt.toLocaleDateString("ro-RO")}
                              </div>
                            </div>
                          </div>

                          <span
                            className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${getStatusClass(
                              ticket.status,
                            )}`}
                          >
                            <StatusIcon size={12} />

                            {ticketStatusLabels[ticket.status]}
                          </span>
                        </div>

                        <div className="mt-5 rounded-2xl border border-white/[0.055] bg-[#0b1220]/55 p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-600">
                            Descriere
                          </p>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                            {ticket.description}
                          </p>
                        </div>

                        <div className="mt-5 rounded-2xl border border-white/[0.055] bg-white/[0.018] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-600">
                              Progres sesizare
                            </p>

                            <span className="text-xs font-medium tabular-nums text-slate-600">
                              {currentStep}/3
                            </span>
                          </div>

                          <div className="mt-5">
                            <div className="flex items-start">
                              {progressSteps.map((progressStep, stepIndex) => {
                                const completed =
                                  currentStep >= progressStep.step;

                                const current =
                                  currentStep === progressStep.step;

                                return (
                                  <div
                                    key={progressStep.step}
                                    className="flex min-w-0 flex-1 items-start last:flex-none"
                                  >
                                    <div className="flex min-w-[58px] flex-col items-center">
                                      <div
                                        className={`flex h-7 w-7 items-center justify-center rounded-full border transition ${
                                          completed
                                            ? current
                                              ? "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-300 shadow-[0_0_16px_rgba(139,92,246,0.28)]"
                                              : "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300"
                                            : "border-white/[0.07] bg-white/[0.025] text-slate-700"
                                        }`}
                                      >
                                        {completed ? (
                                          <CheckCircle2 size={13} />
                                        ) : (
                                          <span className="text-[10px] font-semibold">
                                            {progressStep.step}
                                          </span>
                                        )}
                                      </div>

                                      <p
                                        className={`mt-2 text-center text-[10px] leading-4 ${
                                          current
                                            ? "font-medium text-violet-300"
                                            : completed
                                              ? "text-slate-400"
                                              : "text-slate-700"
                                        }`}
                                      >
                                        {progressStep.label}
                                      </p>
                                    </div>

                                    {stepIndex < progressSteps.length - 1 && (
                                      <div
                                        className={`mt-3.5 h-px flex-1 ${
                                          currentStep > progressStep.step
                                            ? "bg-emerald-400/25"
                                            : "bg-white/[0.065]"
                                        }`}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {ticket.updatedAt.getTime() !==
                          ticket.createdAt.getTime() && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                            <Clock3 size={13} />
                            Ultima actualizare:{" "}
                            {ticket.updatedAt.toLocaleDateString("ro-RO")}
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
    </TenantLayout>
  );
}
