import Link from "next/link";
import { redirect } from "next/navigation";
import { TicketStatus, UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { updateTicketStatusAction } from "./actions";

type AdminTicketsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

const ticketStatusLabels: Record<TicketStatus, string> = {
  OPEN: "Deschisa",
  IN_PROGRESS: "In lucru",
  RESOLVED: "Rezolvata",
  CLOSED: "Inchisa",
};

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

  const tickets = await prisma.ticket.findMany({
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

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin/dashboard"
          className="text-sm text-gray-600 hover:text-black"
        >
          Inapoi la dashboard
        </Link>

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Sesizari locatari
          </h1>

          <p className="mt-2 text-gray-600">
            Gestioneaza sesizarile trimise de locatarii din asociatia
            administrata.
          </p>
        </div>

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

        <section className="mt-8 rounded-2xl bg-white shadow">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Lista sesizari
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Total sesizari: {tickets.length}
            </p>
          </div>

          {tickets.length === 0 ? (
            <div className="p-6 text-sm text-gray-600">
              Nu exista sesizari trimise.
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {tickets.map((ticket) => (
                <article
                  key={ticket.id}
                  className="rounded-2xl border border-gray-200 p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
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
                        {ticket.apartment.owner.name} -{" "}
                        {ticket.apartment.owner.email}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Trimisa la{" "}
                        {ticket.createdAt.toLocaleDateString("ro-RO")}
                      </p>

                      <p className="mt-4 text-sm text-gray-700">
                        {ticket.description}
                      </p>
                    </div>

                    <form
                      action={updateTicketStatusAction}
                      className="flex min-w-60 flex-col gap-3"
                    >
                      <input type="hidden" name="ticketId" value={ticket.id} />

                      <label className="text-sm font-medium text-gray-700">
                        Schimba status
                      </label>

                      <select
                        name="status"
                        defaultValue={ticket.status}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
                      >
                        <option value={TicketStatus.OPEN}>Deschisa</option>
                        <option value={TicketStatus.IN_PROGRESS}>
                          In lucru
                        </option>
                        <option value={TicketStatus.RESOLVED}>Rezolvata</option>
                        <option value={TicketStatus.CLOSED}>Inchisa</option>
                      </select>

                      <button
                        type="submit"
                        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                      >
                        Actualizeaza
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
