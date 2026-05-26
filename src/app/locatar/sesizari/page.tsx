import Link from "next/link";
import { redirect } from "next/navigation";
import { TicketStatus, UserRole } from "@/generated/prisma/client";
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

  const apartment = await prisma.apartment.findFirst({
    where: {
      ownerId: session.id,
    },
    include: {
      association: true,
    },
  });

  if (!apartment) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/locatar/dashboard"
            className="text-sm text-gray-600 hover:text-black"
          >
            Inapoi la dashboard
          </Link>

          <div className="mt-6 rounded-2xl bg-white p-8 shadow">
            <h1 className="text-2xl font-bold text-gray-900">Sesizari</h1>
            <p className="mt-4 text-gray-600">
              Nu exista niciun apartament asociat contului tau.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const tickets = await prisma.ticket.findMany({
    where: {
      apartmentId: apartment.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/locatar/dashboard"
          className="text-sm text-gray-600 hover:text-black"
        >
          Inapoi la dashboard
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.3fr]">
          <section className="rounded-2xl bg-white p-8 shadow">
            <h1 className="text-3xl font-bold text-gray-900">
              Trimite sesizare
            </h1>

            <p className="mt-2 text-gray-600">
              Apartament {apartment.number}, {apartment.association.name}
            </p>

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

            <form action={createTicketAction} className="mt-8 space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Titlu
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  placeholder="Ex: Bec ars pe scara"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Descriere
                </label>
                <textarea
                  name="description"
                  required
                  rows={6}
                  placeholder="Descrie problema observata..."
                  className="mt-1 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-black px-4 py-2 font-medium text-white hover:bg-gray-800"
              >
                Trimite sesizarea
              </button>
            </form>
          </section>

          <section className="rounded-2xl bg-white shadow">
            <div className="border-b border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Sesizarile mele
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Total sesizari: {tickets.length}
              </p>
            </div>

            {tickets.length === 0 ? (
              <div className="p-6 text-sm text-gray-600">
                Nu ai trimis inca nicio sesizare.
              </div>
            ) : (
              <div className="space-y-4 p-6">
                {tickets.map((ticket) => (
                  <article
                    key={ticket.id}
                    className="rounded-2xl border border-gray-200 p-5"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {ticket.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          Trimisa la{" "}
                          {ticket.createdAt.toLocaleDateString("ro-RO")}
                        </p>
                      </div>

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                          ticket.status,
                        )}`}
                      >
                        {ticketStatusLabels[ticket.status]}
                      </span>
                    </div>

                    <p className="mt-4 text-sm text-gray-700">
                      {ticket.description}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
