import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock3,
  Inbox,
  LifeBuoy,
  Mail,
  MessageSquareText,
  UserRound,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TicketStatus, UserRole } from "@/generated/prisma/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { updateTicketStatusAction } from "./actions";

type AdminTicketsPageProps = {
  searchParams: Promise<{
    status?: string;
    error?: string;
    success?: string;
  }>;
};

type TicketFilter = TicketStatus | "ALL";

const ticketStatusLabels: Record<TicketStatus, string> = {
  OPEN: "Deschisă",
  IN_PROGRESS: "În lucru",
  RESOLVED: "Rezolvată",
  CLOSED: "Închisă",
};

const nextTicketStatus: Partial<Record<TicketStatus, TicketStatus>> = {
  [TicketStatus.OPEN]: TicketStatus.IN_PROGRESS,
  [TicketStatus.IN_PROGRESS]: TicketStatus.RESOLVED,
  [TicketStatus.RESOLVED]: TicketStatus.CLOSED,
};

const nextStatusButtonLabels: Partial<Record<TicketStatus, string>> = {
  [TicketStatus.OPEN]: "Preia în lucru",
  [TicketStatus.IN_PROGRESS]: "Marchează rezolvată",
  [TicketStatus.RESOLVED]: "Închide sesizarea",
};

const filterOptions: Array<{
  value: TicketFilter;
  label: string;
}> = [
  {
    value: "ALL",
    label: "Toate",
  },
  {
    value: TicketStatus.OPEN,
    label: "Deschise",
  },
  {
    value: TicketStatus.IN_PROGRESS,
    label: "În lucru",
  },
  {
    value: TicketStatus.RESOLVED,
    label: "Rezolvate",
  },
  {
    value: TicketStatus.CLOSED,
    label: "Închise",
  },
];

function getStatusClass(status: TicketStatus) {
  if (status === TicketStatus.RESOLVED) {
    return "border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300";
  }

  if (status === TicketStatus.IN_PROGRESS) {
    return "border-amber-400/15 bg-amber-400/[0.07] text-amber-300";
  }

  if (status === TicketStatus.CLOSED) {
    return "border-slate-400/10 bg-slate-400/[0.06] text-slate-400";
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

  if (status === TicketStatus.CLOSED) {
    return XCircle;
  }

  return CircleDot;
}

function getSelectedFilter(value: string | undefined): TicketFilter {
  if (value && Object.values(TicketStatus).includes(value as TicketStatus)) {
    return value as TicketStatus;
  }

  return "ALL";
}

function getFilterUrl(filter: TicketFilter) {
  if (filter === "ALL") {
    return "/admin/sesizari";
  }

  return `/admin/sesizari?status=${filter}`;
}

export default async function AdminTicketsPage({
  searchParams,
}: AdminTicketsPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.ADMIN) {
    redirect("/locatar/dashboard");
  }

  const params = await searchParams;

  const selectedFilter = getSelectedFilter(params.status);

  const allTickets = await prisma.ticket.findMany({
    where: {
      apartment: {
        association: {
          adminId: session.id,
        },
      },
    },

    include: {
      apartment: {
        include: {
          owner: true,
          association: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  const tickets =
    selectedFilter === "ALL"
      ? allTickets
      : allTickets.filter((ticket) => ticket.status === selectedFilter);

  const statusCounts: Record<TicketFilter, number> = {
    ALL: allTickets.length,

    [TicketStatus.OPEN]: allTickets.filter(
      (ticket) => ticket.status === TicketStatus.OPEN,
    ).length,

    [TicketStatus.IN_PROGRESS]: allTickets.filter(
      (ticket) => ticket.status === TicketStatus.IN_PROGRESS,
    ).length,

    [TicketStatus.RESOLVED]: allTickets.filter(
      (ticket) => ticket.status === TicketStatus.RESOLVED,
    ).length,

    [TicketStatus.CLOSED]: allTickets.filter(
      (ticket) => ticket.status === TicketStatus.CLOSED,
    ).length,
  };

  const activeTickets =
    statusCounts[TicketStatus.OPEN] + statusCounts[TicketStatus.IN_PROGRESS];

  return (
    <AdminLayout
      title="Sesizări locatari"
      description="Gestionează și urmărește sesizările trimise de locatarii din asociația administrată."
    >
      <div className="mx-auto max-w-7xl space-y-8">
        {params.error && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-400/15 bg-rose-500/[0.08] p-4 text-sm text-rose-300">
            <XCircle size={18} className="mt-0.5 shrink-0" />

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
                Support operations
              </p>
            </div>

            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-100">
              Centru de sesizări
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Monitorizează solicitările locatarilor și evoluția lor prin fluxul
              de soluționare.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Link
              href={getFilterUrl("ALL")}
              className={`group relative overflow-hidden rounded-[20px] border p-5 transition duration-200 hover:-translate-y-1 ${
                selectedFilter === "ALL"
                  ? "border-violet-400/20 bg-violet-500/[0.08] shadow-[0_18px_45px_rgba(118,103,247,0.08)]"
                  : "border-white/[0.07] bg-[#10182a]/70 hover:border-violet-400/15"
              }`}
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-violet-500/[0.08] blur-3xl" />

              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-400">Toate</p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {statusCounts.ALL}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">Total sesizări</p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/10">
                  <Inbox size={18} />
                </div>
              </div>
            </Link>

            <Link
              href={getFilterUrl(TicketStatus.OPEN)}
              className={`group relative overflow-hidden rounded-[20px] border p-5 transition duration-200 hover:-translate-y-1 ${
                selectedFilter === TicketStatus.OPEN
                  ? "border-blue-400/20 bg-blue-400/[0.07]"
                  : "border-white/[0.07] bg-[#10182a]/70 hover:border-blue-400/15"
              }`}
            >
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-400">Deschise</p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {statusCounts[TicketStatus.OPEN]}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Necesită preluare
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-blue-400/10 text-blue-300 ring-1 ring-blue-400/10">
                  <CircleDot size={18} />
                </div>
              </div>
            </Link>

            <Link
              href={getFilterUrl(TicketStatus.IN_PROGRESS)}
              className={`group relative overflow-hidden rounded-[20px] border p-5 transition duration-200 hover:-translate-y-1 ${
                selectedFilter === TicketStatus.IN_PROGRESS
                  ? "border-amber-400/20 bg-amber-400/[0.07]"
                  : "border-white/[0.07] bg-[#10182a]/70 hover:border-amber-400/15"
              }`}
            >
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-400">În lucru</p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {statusCounts[TicketStatus.IN_PROGRESS]}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    În curs de rezolvare
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/10">
                  <Clock3 size={18} />
                </div>
              </div>
            </Link>

            <Link
              href={getFilterUrl(TicketStatus.RESOLVED)}
              className={`group relative overflow-hidden rounded-[20px] border p-5 transition duration-200 hover:-translate-y-1 ${
                selectedFilter === TicketStatus.RESOLVED
                  ? "border-emerald-400/20 bg-emerald-400/[0.07]"
                  : "border-white/[0.07] bg-[#10182a]/70 hover:border-emerald-400/15"
              }`}
            >
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Rezolvate
                  </p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {statusCounts[TicketStatus.RESOLVED]}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Așteaptă închiderea
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/10">
                  <CheckCircle2 size={18} />
                </div>
              </div>
            </Link>

            <Link
              href={getFilterUrl(TicketStatus.CLOSED)}
              className={`group relative overflow-hidden rounded-[20px] border p-5 transition duration-200 hover:-translate-y-1 ${
                selectedFilter === TicketStatus.CLOSED
                  ? "border-slate-400/15 bg-slate-400/[0.06]"
                  : "border-white/[0.07] bg-[#10182a]/70 hover:border-white/[0.12]"
              }`}
            >
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-400">Închise</p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {statusCounts[TicketStatus.CLOSED]}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">Flux finalizat</p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-slate-400/[0.08] text-slate-400 ring-1 ring-white/[0.05]">
                  <XCircle size={18} />
                </div>
              </div>
            </Link>
          </div>
        </section>

        <section className="app-card overflow-hidden">
          <div className="flex flex-col gap-5 border-b border-white/[0.07] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.65)]" />

                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400">
                  Ticket queue
                </p>
              </div>

              <h2 className="mt-2 text-lg font-semibold text-slate-100">
                Lista sesizări
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Afișate: {tickets.length} din {allTickets.length}
                {activeTickets > 0 && <> · {activeTickets} active</>}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <Link
                  key={option.value}
                  href={getFilterUrl(option.value)}
                  className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                    selectedFilter === option.value
                      ? "border-violet-400/20 bg-violet-500/[0.09] text-violet-200"
                      : "border-white/[0.06] bg-white/[0.025] text-slate-500 hover:border-violet-400/15 hover:bg-violet-500/[0.04] hover:text-slate-300"
                  }`}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>

          {tickets.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-slate-500">
                <LifeBuoy size={24} strokeWidth={1.7} />
              </div>

              <h3 className="mt-4 font-medium text-slate-300">
                Nu există sesizări pentru filtrul selectat
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Schimbă filtrul pentru a consulta alte sesizări din registru.
              </p>

              {selectedFilter !== "ALL" && (
                <Link
                  href="/admin/sesizari"
                  className="app-button-secondary mt-5 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
                >
                  <Inbox size={15} />
                  Vezi toate sesizările
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4 p-5 sm:p-6">
              {tickets.map((ticket) => {
                const nextStatus = nextTicketStatus[ticket.status];

                const buttonLabel = nextStatusButtonLabels[ticket.status];

                const StatusIcon = getStatusIcon(ticket.status);

                return (
                  <article
                    key={ticket.id}
                    className="group relative overflow-hidden rounded-[20px] border border-white/[0.065] bg-white/[0.018] transition duration-200 hover:border-violet-400/15 hover:bg-violet-500/[0.02]"
                  >
                    <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-violet-500/[0.035] blur-3xl" />

                    <div className="relative flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-violet-500/[0.08] text-violet-300 ring-1 ring-violet-400/10">
                            <MessageSquareText size={19} strokeWidth={1.8} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-lg font-semibold tracking-[-0.025em] text-slate-100">
                                {ticket.title}
                              </h3>

                              <span
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${getStatusClass(
                                  ticket.status,
                                )}`}
                              >
                                <StatusIcon size={12} />

                                {ticketStatusLabels[ticket.status]}
                              </span>
                            </div>

                            <p className="mt-1 text-xs text-slate-600">
                              ID sesizare:{" "}
                              <span className="font-mono">
                                {ticket.id.slice(-8)}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-600">
                              <Building2 size={12} />
                              Apartament
                            </p>

                            <p className="mt-1.5 text-sm font-medium text-slate-300">
                              Ap. {ticket.apartment.number}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-slate-600">
                              {ticket.apartment.association.name}
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-600">
                              <UserRound size={12} />
                              Locatar
                            </p>

                            <p className="mt-1.5 truncate text-sm font-medium text-slate-300">
                              {ticket.apartment.owner.name}
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-600">
                              <Mail size={12} />
                              Email
                            </p>

                            <p className="mt-1.5 truncate text-sm text-slate-400">
                              {ticket.apartment.owner.email}
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-600">
                              <CalendarDays size={12} />
                              Trimisă
                            </p>

                            <p className="mt-1.5 text-sm font-medium text-slate-300">
                              {ticket.createdAt.toLocaleDateString("ro-RO")}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 rounded-2xl border border-white/[0.055] bg-[#0b1220]/55 p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-600">
                            Descriere
                          </p>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                            {ticket.description}
                          </p>
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

                      <div className="w-full shrink-0 lg:w-[245px]">
                        {nextStatus && buttonLabel ? (
                          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                              Următorul pas
                            </p>

                            <div className="mt-3 flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/[0.08] text-violet-300 ring-1 ring-violet-400/10">
                                <ArrowRight size={16} />
                              </div>

                              <div>
                                <p className="text-sm font-medium text-slate-300">
                                  {ticketStatusLabels[nextStatus]}
                                </p>

                                <p className="mt-0.5 text-xs text-slate-600">
                                  Tranziție permisă
                                </p>
                              </div>
                            </div>

                            <form
                              action={updateTicketStatusAction}
                              className="mt-4"
                            >
                              <input
                                type="hidden"
                                name="ticketId"
                                value={ticket.id}
                              />

                              <input
                                type="hidden"
                                name="status"
                                value={nextStatus}
                              />

                              <input
                                type="hidden"
                                name="returnStatus"
                                value={selectedFilter}
                              />

                              <button
                                type="submit"
                                className="app-button-primary inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium"
                              >
                                {buttonLabel}
                                <ArrowRight size={15} />
                              </button>
                            </form>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.035] p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/[0.08] text-emerald-300 ring-1 ring-emerald-400/10">
                                <CheckCircle2 size={17} />
                              </div>

                              <div>
                                <p className="text-sm font-medium text-emerald-200">
                                  Sesizare închisă
                                </p>

                                <p className="mt-0.5 text-xs text-slate-600">
                                  Flux finalizat
                                </p>
                              </div>
                            </div>

                            <p className="mt-3 text-xs leading-5 text-slate-500">
                              Nu mai sunt necesare acțiuni pentru această
                              sesizare.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
