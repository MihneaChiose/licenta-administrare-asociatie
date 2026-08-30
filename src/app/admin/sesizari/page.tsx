import Link from "next/link";
import { redirect } from "next/navigation";
import { TicketStatus, UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { updateTicketStatusAction } from "./actions";
import { AdminLayout } from "@/components/layout/AdminLayout";

type AdminTicketsPageProps = {
  searchParams: Promise<{
    status?: string;
    error?: string;
    success?: string;
  }>;
};

type TicketFilter = TicketStatus | "ALL";

const ticketStatusLabels: Record<TicketStatus, string> = {
  OPEN: "Deschisa",
  IN_PROGRESS: "In lucru",
  RESOLVED: "Rezolvata",
  CLOSED: "Inchisa",
};

const nextTicketStatus: Partial<Record<TicketStatus, TicketStatus>> = {
  [TicketStatus.OPEN]: TicketStatus.IN_PROGRESS,
  [TicketStatus.IN_PROGRESS]: TicketStatus.RESOLVED,
  [TicketStatus.RESOLVED]: TicketStatus.CLOSED,
};

const nextStatusButtonLabels: Partial<Record<TicketStatus, string>> = {
  [TicketStatus.OPEN]: "Preia in lucru",
  [TicketStatus.IN_PROGRESS]: "Marcheaza rezolvata",
  [TicketStatus.RESOLVED]: "Inchide sesizarea",
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
    label: "In lucru",
  },
  {
    value: TicketStatus.RESOLVED,
    label: "Rezolvate",
  },
  {
    value: TicketStatus.CLOSED,
    label: "Inchise",
  },
];

function getStatusClass(status: TicketStatus) {
  if (status === TicketStatus.RESOLVED) {
    return "bg-green-50 text-green-700";
  }

  if (status === TicketStatus.IN_PROGRESS) {
    return "bg-yellow-50 text-yellow-700";
  }

  if (status === TicketStatus.CLOSED) {
    return "bg-gray-100 text-gray-700";
  }

  return "bg-blue-50 text-blue-700";
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

  return (
    <AdminLayout
      title="Sesizari locatari"
      description="Gestioneaza si urmareste sesizarile trimise de locatarii din asociatia administrata."
    >
      <div className="mx-auto max-w-7xl">
        {params.error && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {params.error}
          </div>
        )}

        {params.success && (
          <div className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-700">
            {params.success}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {filterOptions.map((option) => (
            <Link
              key={option.value}
              href={getFilterUrl(option.value)}
              className={`rounded-2xl p-5 shadow transition ${
                selectedFilter === option.value
                  ? "bg-black text-white"
                  : "bg-white text-gray-900 hover:bg-gray-50"
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  selectedFilter === option.value
                    ? "text-gray-300"
                    : "text-gray-500"
                }`}
              >
                {option.label}
              </p>

              <p className="mt-2 text-3xl font-bold">
                {statusCounts[option.value]}
              </p>
            </Link>
          ))}
        </div>

        <section className="mt-8 rounded-2xl bg-white shadow">
          <div className="border-b border-gray-200 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Lista sesizari
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  Afisate: {tickets.length} din {allTickets.length}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {filterOptions.map((option) => (
                  <Link
                    key={option.value}
                    href={getFilterUrl(option.value)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      selectedFilter === option.value
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {tickets.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-gray-700">
                Nu exista sesizari pentru filtrul selectat.
              </p>

              {selectedFilter !== "ALL" && (
                <Link
                  href="/admin/sesizari"
                  className="mt-3 inline-flex text-sm font-medium text-gray-900 underline"
                >
                  Vezi toate sesizarile
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {tickets.map((ticket) => {
                const nextStatus = nextTicketStatus[ticket.status];

                const buttonLabel = nextStatusButtonLabels[ticket.status];

                return (
                  <article
                    key={ticket.id}
                    className="rounded-2xl border border-gray-200 p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {ticket.title}
                          </h3>

                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                              ticket.status,
                            )}`}
                          >
                            {ticketStatusLabels[ticket.status]}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-gray-600">
                          Ap. {ticket.apartment.number} -{" "}
                          {ticket.apartment.owner.name}
                        </p>

                        <p className="mt-1 text-sm text-gray-600">
                          {ticket.apartment.association.name}
                        </p>

                        <p className="mt-1 text-sm text-gray-600">
                          Email locatar: {ticket.apartment.owner.email}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          Trimisa la{" "}
                          {ticket.createdAt.toLocaleDateString("ro-RO")}
                        </p>

                        {ticket.updatedAt.getTime() !==
                          ticket.createdAt.getTime() && (
                          <p className="mt-1 text-sm text-gray-500">
                            Ultima actualizare:{" "}
                            {ticket.updatedAt.toLocaleDateString("ro-RO")}
                          </p>
                        )}

                        <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700">
                          {ticket.description}
                        </p>
                      </div>

                      <div className="w-full lg:w-60">
                        {nextStatus && buttonLabel ? (
                          <div className="rounded-xl bg-gray-50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                              Urmatorul pas
                            </p>

                            <p className="mt-2 text-sm font-medium text-gray-900">
                              {ticketStatusLabels[nextStatus]}
                            </p>

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
                                className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                              >
                                {buttonLabel}
                              </button>
                            </form>
                          </div>
                        ) : (
                          <div className="rounded-xl bg-gray-50 p-4">
                            <p className="text-sm font-medium text-gray-700">
                              Sesizare inchisa
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              Nu mai sunt necesare actiuni.
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
