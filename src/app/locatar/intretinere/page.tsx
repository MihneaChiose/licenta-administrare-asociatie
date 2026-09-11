import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  FileText,
  ReceiptText,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { redirect } from "next/navigation";
import {
  InvoiceStatus,
  MaintenanceListStatus,
  UserRole,
} from "@/generated/prisma/client";
import { TenantLayout } from "@/components/layout/TenantLayout";
import { InvoiceCalculationDetails } from "@/components/maintenance/InvoiceCalculationDetails";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { startStripeCheckoutAction } from "./actions";

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
  UNPAID: "Neplătită",
  PENDING: "În așteptare",
  PAID: "Plătită",
  CANCELLED: "Anulată",
};

const moneyFormatter = new Intl.NumberFormat("ro-RO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function getInvoiceStatusClass(status: InvoiceStatus) {
  if (status === InvoiceStatus.UNPAID) {
    return "border-rose-400/15 bg-rose-400/[0.07] text-rose-300";
  }

  if (status === InvoiceStatus.PAID) {
    return "border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300";
  }

  if (status === InvoiceStatus.PENDING) {
    return "border-amber-400/15 bg-amber-400/[0.07] text-amber-300";
  }

  if (status === InvoiceStatus.CANCELLED) {
    return "border-slate-400/10 bg-slate-400/[0.06] text-slate-400";
  }

  return "border-white/[0.07] bg-white/[0.035] text-slate-400";
}

type TenantInvoicesPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function TenantInvoicesPage({
  searchParams,
}: TenantInvoicesPageProps) {
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
      <TenantLayout title="Informații indisponibile">
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

  const invoices = await prisma.invoice.findMany({
    where: {
      apartmentId: apartment.id,

      maintenanceList: {
        status: {
          in: [MaintenanceListStatus.PUBLISHED, MaintenanceListStatus.CLOSED],
        },
      },
    },

    include: {
      maintenanceList: {
        select: {
          publishedAt: true,
          status: true,
        },
      },

      items: {
        orderBy: {
          description: "asc",
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

  const unpaidInvoices = invoices.filter(
    (invoice) => invoice.status === InvoiceStatus.UNPAID,
  );

  const totalUnpaid = unpaidInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.totalAmount.toString()),
    0,
  );

  return (
    <TenantLayout title="Întreținere și plăți">
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
                My financial overview
              </p>
            </div>

            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-100">
              Situație întreținere
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-rose-400/[0.06] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Total de plată
                  </p>

                  <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-50">
                    {moneyFormatter.format(totalUnpaid)}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">RON</p>
                </div>

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-[14px] ring-1 ${
                    totalUnpaid > 0
                      ? "bg-rose-400/10 text-rose-300 ring-rose-400/10"
                      : "bg-emerald-400/10 text-emerald-300 ring-emerald-400/10"
                  }`}
                >
                  <CircleDollarSign size={20} strokeWidth={1.8} />
                </div>
              </div>
            </div>

            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-violet-500/[0.08] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Facturi restante
                  </p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {unpaidInvoices.length}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Facturi neplătite
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/10">
                  <ReceiptText size={20} strokeWidth={1.8} />
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
                  Maintenance history
                </p>
              </div>

              <h2 className="mt-2 text-lg font-semibold text-slate-100">
                Istoric
              </h2>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs text-slate-500">
              <Building2 size={14} />
              Ap. {apartment.number}
            </div>
          </div>

          {invoices.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-slate-500">
                <ReceiptText size={24} strokeWidth={1.7} />
              </div>

              <h3 className="mt-4 font-medium text-slate-300">
                Nu există facturi de întreținere
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Listele de întreținere vor apărea aici după ce sunt calculate și
                publicate de administrator.
              </p>
            </div>
          ) : (
            <div className="space-y-5 p-5 sm:p-6">
              {invoices.map((invoice) => {
                const canInitiatePayment =
                  invoice.status !== InvoiceStatus.PAID &&
                  invoice.status !== InvoiceStatus.CANCELLED;

                return (
                  <article
                    key={invoice.id}
                    className="group relative overflow-hidden rounded-[22px] border border-white/[0.065] bg-white/[0.018] transition duration-200 hover:border-violet-400/15"
                  >
                    <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-500/[0.04] blur-3xl" />

                    <div className="relative border-b border-white/[0.06] p-5 sm:p-6">
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/10">
                              <CalendarDays size={19} />
                            </div>

                            <div>
                              <div className="flex flex-wrap items-center gap-2.5">
                                <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-100">
                                  {monthNames[invoice.month]} {invoice.year}
                                </h3>

                                <span
                                  className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium ${getInvoiceStatusClass(
                                    invoice.status,
                                  )}`}
                                >
                                  {invoiceStatusLabels[invoice.status]}
                                </span>
                              </div>

                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
                                <div className="flex items-center gap-1.5">
                                  <FileText size={13} />
                                  Generată{" "}
                                  {invoice.generatedAt.toLocaleDateString(
                                    "ro-RO",
                                  )}
                                </div>

                                {invoice.maintenanceList.publishedAt && (
                                  <div className="flex items-center gap-1.5">
                                    <CheckCircle2 size={13} />
                                    Publicată{" "}
                                    {invoice.maintenanceList.publishedAt.toLocaleDateString(
                                      "ro-RO",
                                    )}
                                  </div>
                                )}

                                {invoice.paidAt && (
                                  <div className="flex items-center gap-1.5">
                                    <CreditCard size={13} />
                                    Plătită{" "}
                                    {invoice.paidAt.toLocaleDateString("ro-RO")}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 lg:min-w-[280px] lg:text-right">
                          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-600">
                            Total întreținere
                          </p>

                          <p className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-slate-50">
                            {moneyFormatter.format(
                              Number(invoice.totalAmount.toString()),
                            )}

                            <span className="ml-1.5 text-sm font-medium text-slate-500">
                              RON
                            </span>
                          </p>

                          {canInitiatePayment && (
                            <div className="mt-5 flex flex-col gap-2.5 lg:items-end">
                              <form
                                action={startStripeCheckoutAction}
                                className="w-full lg:w-auto"
                              >
                                <input
                                  type="hidden"
                                  name="invoiceId"
                                  value={invoice.id}
                                />

                                <button
                                  type="submit"
                                  className="app-button-primary inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium lg:w-auto"
                                >
                                  <CreditCard size={16} />
                                  Plătește online
                                </button>
                              </form>
                            </div>
                          )}
                        </div>
                      </div>

                      {invoice.status === InvoiceStatus.CANCELLED && (
                        <div className="mt-5 flex items-start gap-3 rounded-xl border border-rose-400/10 bg-rose-400/[0.035] p-3.5">
                          <XCircle
                            size={17}
                            className="mt-0.5 shrink-0 text-rose-300"
                          />

                          <div>
                            <p className="text-sm font-medium text-rose-200">
                              Factură anulată
                            </p>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              Această factură nu mai poate fi procesată pentru
                              plată.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="relative p-5 sm:p-6">
                      <details className="group/details">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 transition hover:border-violet-400/15 hover:bg-violet-500/[0.03]">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/[0.07] text-cyan-300 ring-1 ring-cyan-400/10">
                              <ReceiptText size={16} />
                            </div>

                            <div>
                              <p className="text-sm font-medium text-slate-300">
                                Detalierea întreținerii
                              </p>

                              <p className="mt-0.5 text-xs text-slate-600">
                                {invoice.items.length} utilități
                              </p>
                            </div>
                          </div>

                          <ChevronDown
                            size={17}
                            className="text-slate-500 transition-transform duration-200 group-open/details:rotate-180"
                          />
                        </summary>

                        <div className="mt-4">
                          <InvoiceCalculationDetails items={invoice.items} />
                        </div>
                      </details>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </TenantLayout>
  );
}
