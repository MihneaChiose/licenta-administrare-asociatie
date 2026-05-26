import Link from "next/link";
import { redirect } from "next/navigation";
import { InvoiceStatus, UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { generateInvoicesAction } from "./actions";

type MaintenancePageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

const monthNames: Record<number, string> = {
  1: "Ianuarie",
  2: "Februarie",
  3: "Martie",
  4: "Aprilie",
  5: "Mai",
  6: "Iunie",
  7: "Iulie",
  8: "August",
  9: "Septembrie",
  10: "Octombrie",
  11: "Noiembrie",
  12: "Decembrie",
};

const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  UNPAID: "Neplatita",
  PENDING: "In asteptare",
  PAID: "Platita",
  CANCELLED: "Anulata",
};

export default async function AdminMaintenancePage({
  searchParams,
}: MaintenancePageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.ADMIN) {
    redirect("/locatar/dashboard");
  }

  const params = await searchParams;

  const invoices = await prisma.invoice.findMany({
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
      items: true,
    },
    orderBy: [
      {
        year: "desc",
      },
      {
        month: "desc",
      },
      {
        apartment: {
          number: "asc",
        },
      },
    ],
  });

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin/dashboard"
          className="text-sm text-gray-600 hover:text-black"
        >
          Inapoi la dashboard
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.5fr]">
          <section className="rounded-2xl bg-white p-8 shadow">
            <h1 className="text-3xl font-bold text-gray-900">
              Generare intretinere
            </h1>

            <p className="mt-2 text-gray-600">
              Genereaza automat sumele lunare pentru fiecare apartament pe baza
              cheltuielilor si consumurilor introduse.
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

            <form action={generateInvoicesAction} className="mt-8 space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Luna
                </label>
                <select
                  name="month"
                  defaultValue={currentMonth}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                >
                  {Object.entries(monthNames).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">An</label>
                <input
                  name="year"
                  type="number"
                  defaultValue={currentYear}
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-black px-4 py-2 font-medium text-white hover:bg-gray-800"
              >
                Genereaza intretinerea
              </button>
            </form>

            <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
              <p className="font-medium text-gray-800">Atentie:</p>
              <p className="mt-1">
                Dupa generare, sumele sunt salvate in facturi lunare. Pentru
                moment, sistemul nu permite regenerarea aceleiasi luni.
              </p>
            </div>
          </section>

          <section className="rounded-2xl bg-white shadow">
            <div className="border-b border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Facturi generate
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Total facturi: {invoices.length}
              </p>
            </div>

            {invoices.length === 0 ? (
              <div className="p-6 text-sm text-gray-600">
                Nu exista facturi generate.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-6 py-3 font-medium">Luna</th>
                      <th className="px-6 py-3 font-medium">Apartament</th>
                      <th className="px-6 py-3 font-medium">Locatar</th>
                      <th className="px-6 py-3 font-medium">Total</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Detalii</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {monthNames[invoice.month]} {invoice.year}
                        </td>

                        <td className="px-6 py-4 text-gray-700">
                          Ap. {invoice.apartment.number}
                        </td>

                        <td className="px-6 py-4 text-gray-700">
                          {invoice.apartment.owner.name}
                        </td>

                        <td className="px-6 py-4 text-gray-700">
                          {invoice.totalAmount.toString()} RON
                        </td>

                        <td className="px-6 py-4 text-gray-700">
                          {invoiceStatusLabels[invoice.status]}
                        </td>

                        <td className="px-6 py-4 text-gray-700">
                          {invoice.items.length} pozitii
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
