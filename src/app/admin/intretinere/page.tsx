import { redirect } from "next/navigation";
import {
  InvoiceStatus,
  MaintenanceListStatus,
  UserRole,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  calculateMaintenanceListAction,
  closeMaintenanceListAction,
  publishMaintenanceListAction,
} from "./actions";
import { AdminLayout } from "@/components/layout/AdminLayout";

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

const maintenanceListStatusLabels: Record<MaintenanceListStatus, string> = {
  DRAFT: "Draft",
  CALCULATED: "Calculată",
  PUBLISHED: "Publicată",
  CLOSED: "Închisă",
};

const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  UNPAID: "Neplătită",
  PENDING: "În așteptare",
  PAID: "Plătită",
  CANCELLED: "Anulată",
};

function getListStatusClass(status: MaintenanceListStatus) {
  if (status === MaintenanceListStatus.PUBLISHED) {
    return "bg-green-50 text-green-700";
  }

  if (status === MaintenanceListStatus.CALCULATED) {
    return "bg-blue-50 text-blue-700";
  }

  if (status === MaintenanceListStatus.CLOSED) {
    return "bg-gray-200 text-gray-700";
  }

  return "bg-yellow-50 text-yellow-700";
}

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

  const maintenanceLists = await prisma.maintenanceList.findMany({
    where: {
      association: {
        adminId: session.id,
      },
    },
    include: {
      invoices: {
        include: {
          apartment: {
            include: {
              owner: true,
            },
          },
          items: true,
        },
      },
    },
    orderBy: [
      {
        year: "desc",
      },
      {
        month: "desc",
      },
    ],
  });

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  return (
    <AdminLayout
      title="Liste de întreținere"
      description="Calculează, verifică și publică listele lunare de întreținere."
    >
      <div className="mx-auto max-w-7xl">
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.7fr_1.7fr]">
          <section className="rounded-2xl bg-white p-8 shadow">
            <h2 className="text-lg font-semibold text-gray-900">
              Calcul listă
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Selectează perioada pentru care vrei să calculezi lista de
              întreținere.
            </p>

            {params.error && (
              <div className="mt-6 whitespace-pre-line rounded-lg bg-red-50 p-4 text-sm text-red-700">
                {params.error}
              </div>
            )}

            {params.success && (
              <div className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-700">
                {params.success}
              </div>
            )}

            <form
              action={calculateMaintenanceListAction}
              className="mt-8 space-y-5"
            >
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
                Calculează lista
              </button>
            </form>

            <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
              <p className="font-medium text-gray-800">Fluxul listei</p>

              <p className="mt-2">
                O listă calculată nu este vizibilă locatarilor. Verifică sumele
                și folosește butonul „Publică lista” atunci când este corectă.
              </p>

              <p className="mt-2">
                O listă calculată poate fi recalculată. După publicare nu mai
                poate fi recalculată.
              </p>
            </div>
          </section>

          <section className="rounded-2xl bg-white shadow">
            <div className="border-b border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Liste lunare
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                Total liste: {maintenanceLists.length}
              </p>
            </div>

            {maintenanceLists.length === 0 ? (
              <div className="p-6 text-sm text-gray-600">
                Nu există încă liste de întreținere.
              </div>
            ) : (
              <div className="space-y-6 p-6">
                {maintenanceLists.map((maintenanceList) => {
                  const invoices = [...maintenanceList.invoices].sort((a, b) =>
                    a.apartment.number.localeCompare(b.apartment.number, "ro", {
                      numeric: true,
                    }),
                  );

                  const totalAmount = invoices.reduce(
                    (sum, invoice) =>
                      sum + Number(invoice.totalAmount.toString()),
                    0,
                  );

                  return (
                    <article
                      key={maintenanceList.id}
                      className="rounded-2xl border border-gray-200"
                    >
                      <div className="flex flex-col gap-4 border-b border-gray-200 p-6 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {monthNames[maintenanceList.month]}{" "}
                              {maintenanceList.year}
                            </h3>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getListStatusClass(
                                maintenanceList.status,
                              )}`}
                            >
                              {
                                maintenanceListStatusLabels[
                                  maintenanceList.status
                                ]
                              }
                            </span>
                          </div>

                          {maintenanceList.calculatedAt && (
                            <p className="mt-2 text-sm text-gray-500">
                              Calculată la{" "}
                              {maintenanceList.calculatedAt.toLocaleDateString(
                                "ro-RO",
                              )}
                            </p>
                          )}

                          {maintenanceList.publishedAt && (
                            <p className="mt-1 text-sm text-gray-500">
                              Publicată la{" "}
                              {maintenanceList.publishedAt.toLocaleDateString(
                                "ro-RO",
                              )}
                            </p>
                          )}

                          {maintenanceList.closedAt && (
                            <p className="mt-1 text-sm text-gray-500">
                              Închisă la{" "}
                              {maintenanceList.closedAt.toLocaleDateString(
                                "ro-RO",
                              )}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-start gap-3 lg:items-end">
                          <div className="text-left lg:text-right">
                            <p className="text-sm text-gray-500">Total listă</p>

                            <p className="text-2xl font-bold text-gray-900">
                              {totalAmount.toFixed(2)} RON
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {maintenanceList.status ===
                              MaintenanceListStatus.DRAFT && (
                              <form action={calculateMaintenanceListAction}>
                                <input
                                  type="hidden"
                                  name="month"
                                  value={maintenanceList.month}
                                />

                                <input
                                  type="hidden"
                                  name="year"
                                  value={maintenanceList.year}
                                />

                                <button
                                  type="submit"
                                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                                >
                                  Calculează
                                </button>
                              </form>
                            )}

                            {maintenanceList.status ===
                              MaintenanceListStatus.CALCULATED && (
                              <>
                                <form action={calculateMaintenanceListAction}>
                                  <input
                                    type="hidden"
                                    name="month"
                                    value={maintenanceList.month}
                                  />

                                  <input
                                    type="hidden"
                                    name="year"
                                    value={maintenanceList.year}
                                  />

                                  <button
                                    type="submit"
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                  >
                                    Recalculează
                                  </button>
                                </form>

                                <form action={publishMaintenanceListAction}>
                                  <input
                                    type="hidden"
                                    name="maintenanceListId"
                                    value={maintenanceList.id}
                                  />

                                  <button
                                    type="submit"
                                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                                  >
                                    Publică lista
                                  </button>
                                </form>
                              </>
                            )}

                            {maintenanceList.status ===
                              MaintenanceListStatus.PUBLISHED && (
                              <form action={closeMaintenanceListAction}>
                                <input
                                  type="hidden"
                                  name="maintenanceListId"
                                  value={maintenanceList.id}
                                />

                                <button
                                  type="submit"
                                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                  Închide lista
                                </button>
                              </form>
                            )}
                          </div>
                        </div>
                      </div>

                      {invoices.length === 0 ? (
                        <div className="p-6 text-sm text-gray-600">
                          Lista nu are încă un calcul valid.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600">
                              <tr>
                                <th className="px-6 py-3 font-medium">
                                  Apartament
                                </th>

                                <th className="px-6 py-3 font-medium">
                                  Locatar
                                </th>

                                <th className="px-6 py-3 font-medium">Total</th>

                                <th className="px-6 py-3 font-medium">
                                  Status plată
                                </th>

                                <th className="px-6 py-3 font-medium">
                                  Poziții
                                </th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">
                              {invoices.map((invoice) => (
                                <tr
                                  key={invoice.id}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-6 py-4 font-medium text-gray-900">
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
                                    {invoice.items.length}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
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
