import {
  Calculator,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  FileText,
  Info,
  RefreshCw,
  Rocket,
  TriangleAlert,
} from "lucide-react";
import { redirect } from "next/navigation";
import {
  InvoiceStatus,
  MaintenanceListStatus,
  UserRole,
} from "@/generated/prisma/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { InvoiceCalculationDetails } from "@/components/maintenance/InvoiceCalculationDetails";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  calculateMaintenanceListAction,
  publishMaintenanceListAction,
} from "./actions";
import { MaintenancePeriodForm } from "./MaintenancePeriodForm";

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
  CLOSED: "Publicată",
};

const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  UNPAID: "Neplătită",
  PENDING: "În așteptare",
  PAID: "Plătită",
  CANCELLED: "Anulată",
};

const maintenanceListStatusStyles: Record<MaintenanceListStatus, string> = {
  DRAFT: "border-amber-400/15 bg-amber-400/[0.07] text-amber-300",
  CALCULATED: "border-blue-400/15 bg-blue-400/[0.07] text-blue-300",
  PUBLISHED: "border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300",
  CLOSED: "border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300",
};

const invoiceStatusStyles: Record<InvoiceStatus, string> = {
  UNPAID: "border-rose-400/15 bg-rose-400/[0.07] text-rose-300",
  PENDING: "border-amber-400/15 bg-amber-400/[0.07] text-amber-300",
  PAID: "border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300",
  CANCELLED: "border-slate-400/10 bg-slate-400/[0.06] text-slate-400",
};

const moneyFormatter = new Intl.NumberFormat("ro-RO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

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

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const maintenanceLists = await prisma.maintenanceList.findMany({
    where: {
      association: {
        adminId: session.id,
      },

      status: {
        not: MaintenanceListStatus.DRAFT,
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

  const allInvoices = maintenanceLists.flatMap(
    (maintenanceList) => maintenanceList.invoices,
  );

  const unpaidInvoices = allInvoices.filter(
    (invoice) => invoice.status === InvoiceStatus.UNPAID,
  ).length;

  const currentMaintenanceList = maintenanceLists.find(
    (maintenanceList) =>
      maintenanceList.month === currentMonth &&
      maintenanceList.year === currentYear,
  );

  const currentListStatus = !currentMaintenanceList
    ? "NEGENERATA"
    : currentMaintenanceList.status === MaintenanceListStatus.CALCULATED
      ? "GENERATA"
      : "PUBLICATA";

  return (
    <AdminLayout title="Liste de întreținere">
      <div className="mx-auto max-w-7xl space-y-8">
        <section>
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.7)]" />

              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                Maintenance engine
              </p>
            </div>

            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-100">
              Situație întreținere
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-violet-500/[0.08] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Status lista curentă
                  </p>

                  <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-50">
                    {currentListStatus}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    {monthNames[currentMonth]} {currentYear}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/10">
                  <FileText size={20} strokeWidth={1.8} />
                </div>
              </div>
            </div>

            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-rose-400/[0.06] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Facturi neachitate
                  </p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {unpaidInvoices}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Status NEPLĂTITĂ
                  </p>
                </div>

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-[14px] ring-1 ${
                    unpaidInvoices > 0
                      ? "bg-rose-400/10 text-rose-300 ring-rose-400/10"
                      : "bg-emerald-400/10 text-emerald-300 ring-emerald-400/10"
                  }`}
                >
                  <TriangleAlert size={20} strokeWidth={1.8} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[0.72fr_1.7fr]">
          <section className="app-card relative h-fit overflow-hidden">
            <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-violet-500/[0.055] blur-3xl" />

            <div className="relative border-b border-white/[0.07] px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/10">
                  <Calculator size={19} />
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                    Generator
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-slate-100">
                    Calcul listă
                  </h2>
                </div>
              </div>
            </div>

            <div className="relative p-6">
              {params.error && (
                <div className="mb-6 flex items-start gap-3 whitespace-pre-line rounded-xl border border-rose-400/15 bg-rose-500/[0.08] p-4 text-sm leading-6 text-rose-300">
                  <TriangleAlert size={18} className="mt-0.5 shrink-0" />

                  <p>{params.error}</p>
                </div>
              )}

              {params.success && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-400/15 bg-emerald-500/[0.08] p-4 text-sm leading-6 text-emerald-300">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" />

                  <p>{params.success}</p>
                </div>
              )}

              <MaintenancePeriodForm
                currentMonth={currentMonth}
                currentYear={currentYear}
              />
            </div>
          </section>

          <section className="app-card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-white/[0.07] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.65)]" />

                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400">
                    Lifecycle
                  </p>
                </div>

                <h2 className="mt-2 text-lg font-semibold text-slate-100">
                  Liste lunare
                </h2>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs text-slate-500">
                <CalendarDays size={15} />
                Evidență întreținere
              </div>
            </div>

            {maintenanceLists.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-slate-500">
                  <Calculator size={24} strokeWidth={1.7} />
                </div>

                <h3 className="mt-4 font-medium text-slate-300">
                  Nu există liste de întreținere
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Selectează o perioadă și rulează primul calcul de întreținere.
                </p>
              </div>
            ) : (
              <div className="space-y-5 p-5 sm:p-6">
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
                      className="overflow-hidden rounded-[20px] border border-white/[0.065] bg-white/[0.018]"
                    >
                      <div className="relative flex flex-col gap-5 border-b border-white/[0.06] p-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-violet-500/[0.04] blur-3xl" />

                        <div className="relative">
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/10">
                              <CalendarDays size={19} strokeWidth={1.8} />
                            </div>

                            <div>
                              <h3 className="text-lg font-semibold tracking-[-0.02em] text-slate-100">
                                {monthNames[maintenanceList.month]}{" "}
                                {maintenanceList.year}
                              </h3>

                              <span
                                className={`mt-1.5 inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium ${
                                  maintenanceListStatusStyles[
                                    maintenanceList.status
                                  ]
                                }`}
                              >
                                {
                                  maintenanceListStatusLabels[
                                    maintenanceList.status
                                  ]
                                }
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                            {maintenanceList.calculatedAt && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Calculator size={13} />

                                <span>
                                  Calculată{" "}
                                  {maintenanceList.calculatedAt.toLocaleDateString(
                                    "ro-RO",
                                  )}
                                </span>
                              </div>
                            )}

                            {maintenanceList.publishedAt && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Rocket size={13} />

                                <span>
                                  Publicată{" "}
                                  {maintenanceList.publishedAt.toLocaleDateString(
                                    "ro-RO",
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="relative flex flex-col gap-4 lg:items-end">
                          <div className="lg:text-right">
                            <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-600">
                              Total listă
                            </p>

                            <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-100">
                              {moneyFormatter.format(totalAmount)}

                              <span className="ml-1.5 text-sm font-medium text-slate-500">
                                RON
                              </span>
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
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
                                    className="app-button-secondary inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
                                  >
                                    <RefreshCw size={15} />
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
                                    className="app-button-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
                                  >
                                    <Rocket size={15} />
                                    Publică lista
                                  </button>
                                </form>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {invoices.length === 0 ? (
                        <div className="flex items-start gap-3 p-5 text-sm text-slate-500">
                          <Info
                            size={17}
                            className="mt-0.5 shrink-0 text-slate-600"
                          />
                          Lista nu are încă un calcul valid.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[720px] text-left text-sm">
                            <thead>
                              <tr className="border-b border-white/[0.055] bg-white/[0.022]">
                                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                  Apartament
                                </th>

                                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                  Locatar
                                </th>

                                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                  Total
                                </th>

                                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                  Status plată
                                </th>

                                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                  Calcul
                                </th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-white/[0.05]">
                              {invoices.map((invoice) => (
                                <tr
                                  key={invoice.id}
                                  className="align-top transition-colors duration-150 hover:bg-violet-500/[0.03]"
                                >
                                  <td className="px-4 py-4">
                                    <span className="inline-flex rounded-lg border border-violet-400/10 bg-violet-500/[0.07] px-2.5 py-1 text-xs font-semibold text-violet-300">
                                      {invoice.apartment.number}
                                    </span>
                                  </td>

                                  <td className="px-4 py-4 font-medium text-slate-300">
                                    {invoice.apartment.owner.name}
                                  </td>

                                  <td className="px-4 py-4">
                                    <span className="font-semibold tabular-nums text-slate-200">
                                      {moneyFormatter.format(
                                        Number(invoice.totalAmount.toString()),
                                      )}
                                    </span>

                                    <span className="ml-1.5 text-xs text-slate-600">
                                      RON
                                    </span>
                                  </td>

                                  <td className="px-4 py-4">
                                    <span
                                      className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium ${
                                        invoiceStatusStyles[invoice.status]
                                      }`}
                                    >
                                      {invoiceStatusLabels[invoice.status]}
                                    </span>
                                  </td>

                                  <td className="px-4 py-4">
                                    <details className="group">
                                      <summary className="flex w-fit cursor-pointer list-none items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs font-medium text-slate-400 transition hover:border-violet-400/15 hover:bg-violet-500/[0.05] hover:text-violet-300">
                                        {invoice.items.length} utilități
                                        <ChevronDown
                                          size={14}
                                          className="transition-transform duration-200 group-open:rotate-180"
                                        />
                                      </summary>

                                      <div className="mt-4 -ml-[100px] w-[calc(100vw-6rem)] sm:-ml-[420px] sm:w-[560px] xl:-ml-[500px]">
                                        <InvoiceCalculationDetails
                                          items={invoice.items}
                                        />
                                      </div>
                                    </details>
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
