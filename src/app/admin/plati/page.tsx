import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Info,
  ReceiptText,
  ShieldCheck,
  TriangleAlert,
  UserRound,
  WalletCards,
  XCircle,
} from "lucide-react";
import { redirect } from "next/navigation";
import { PaymentStatus, UserRole } from "@/generated/prisma/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { confirmPaymentAction } from "./actions";

type AdminPaymentsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

const PAYMENT_METHOD_MANUAL = "MANUAL";
const PAYMENT_METHOD_STRIPE = "STRIPE";

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

const moneyFormatter = new Intl.NumberFormat("ro-RO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function getPaymentStatusLabel(status: PaymentStatus, method: string) {
  if (status === PaymentStatus.PAID) {
    return "Confirmată";
  }

  if (status === PaymentStatus.REJECTED) {
    return method === PAYMENT_METHOD_STRIPE
      ? "Expirată / nereușită"
      : "Respinsă";
  }

  return method === PAYMENT_METHOD_STRIPE
    ? "În procesare Stripe"
    : "În așteptare";
}

function getPaymentStatusClass(status: PaymentStatus) {
  if (status === PaymentStatus.PAID) {
    return "border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300";
  }

  if (status === PaymentStatus.REJECTED) {
    return "border-rose-400/15 bg-rose-400/[0.07] text-rose-300";
  }

  return "border-amber-400/15 bg-amber-400/[0.07] text-amber-300";
}

function getPaymentMethodLabel(method: string) {
  if (method === PAYMENT_METHOD_STRIPE) {
    return "Stripe";
  }

  if (method === PAYMENT_METHOD_MANUAL) {
    return "Manuală";
  }

  return method;
}

function getPaymentMethodClass(method: string) {
  if (method === PAYMENT_METHOD_STRIPE) {
    return "border-violet-400/15 bg-violet-500/[0.07] text-violet-300";
  }

  if (method === PAYMENT_METHOD_MANUAL) {
    return "border-cyan-400/15 bg-cyan-400/[0.06] text-cyan-300";
  }

  return "border-white/[0.07] bg-white/[0.035] text-slate-400";
}

export default async function AdminPaymentsPage({
  searchParams,
}: AdminPaymentsPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.ADMIN) {
    redirect("/locatar/dashboard");
  }

  const params = await searchParams;

  const payments = await prisma.payment.findMany({
    where: {
      invoice: {
        apartment: {
          association: {
            adminId: session.id,
          },
        },
      },
    },

    include: {
      invoice: {
        include: {
          apartment: {
            include: {
              owner: true,
              association: true,
            },
          },
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  const pendingPayments = payments.filter(
    (payment) => payment.status === PaymentStatus.PENDING,
  );

  const confirmedPayments = payments.filter(
    (payment) => payment.status === PaymentStatus.PAID,
  );

  const rejectedPayments = payments.filter(
    (payment) => payment.status === PaymentStatus.REJECTED,
  );

  const stripePayments = payments.filter(
    (payment) => payment.method === PAYMENT_METHOD_STRIPE,
  );

  const manualPayments = payments.filter(
    (payment) => payment.method === PAYMENT_METHOD_MANUAL,
  );

  const confirmedAmount = confirmedPayments.reduce(
    (total, payment) => total + Number(payment.amount.toString()),
    0,
  );

  return (
    <AdminLayout
      title="Plăți locatari"
      description="Urmărește plățile manuale și online aferente întreținerii locatarilor."
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
                Financial operations
              </p>
            </div>

            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-100">
              Situație plăți
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Monitorizează plățile transmise de locatari și procesarea
              acestora.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-violet-500/[0.08] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Plăți totale
                  </p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {payments.length}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Înregistrări disponibile
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/10">
                  <WalletCards size={20} strokeWidth={1.8} />
                </div>
              </div>
            </div>

            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-400/[0.07] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    În procesare
                  </p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {pendingPayments.length}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">Status PENDING</p>
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
                    Confirmate
                  </p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {confirmedPayments.length}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    {moneyFormatter.format(confirmedAmount)} RON
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/10">
                  <CheckCircle2 size={20} strokeWidth={1.8} />
                </div>
              </div>
            </div>

            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-rose-400/[0.06] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Respinse / expirate
                  </p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {rejectedPayments.length}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">Status REJECTED</p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-rose-400/10 text-rose-300 ring-1 ring-rose-400/10">
                  <XCircle size={20} strokeWidth={1.8} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="app-card overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-white/[0.07] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.65)]" />

                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400">
                  Registru financiar
                </p>
              </div>

              <h2 className="mt-2 text-lg font-semibold text-slate-100">
                Lista plăți
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Total înregistrări: {payments.length}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.045] px-3 py-2 text-xs text-cyan-300">
                <Banknote size={14} />
                Manuale: {manualPayments.length}
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl border border-violet-400/10 bg-violet-500/[0.05] px-3 py-2 text-xs text-violet-300">
                <CreditCard size={14} />
                Stripe: {stripePayments.length}
              </div>
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-slate-500">
                <WalletCards size={24} strokeWidth={1.7} />
              </div>

              <h3 className="mt-4 font-medium text-slate-300">
                Nu există plăți înregistrate
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Plățile transmise de locatari sau procesate online vor apărea
                aici.
              </p>
            </div>
          ) : (
            <div className="space-y-4 p-5 sm:p-6">
              {payments.map((payment) => {
                const isStripe = payment.method === PAYMENT_METHOD_STRIPE;

                const isManual = payment.method === PAYMENT_METHOD_MANUAL;

                const canConfirmManually =
                  payment.status === PaymentStatus.PENDING && isManual;

                return (
                  <article
                    key={payment.id}
                    className="group relative overflow-hidden rounded-[20px] border border-white/[0.065] bg-white/[0.02] transition duration-200 hover:border-violet-400/15 hover:bg-violet-500/[0.025]"
                  >
                    <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-violet-500/[0.035] blur-3xl" />

                    <div className="relative flex flex-col gap-6 p-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white/[0.035] text-slate-400 ring-1 ring-white/[0.06]">
                            <UserRound size={19} strokeWidth={1.8} />
                          </div>

                          <div>
                            <h3 className="font-semibold tracking-[-0.02em] text-slate-100">
                              Ap. {payment.invoice.apartment.number}
                              <span className="mx-2 text-slate-700">/</span>
                              {payment.invoice.apartment.owner.name}
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                              {payment.invoice.apartment.association.name}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${getPaymentStatusClass(
                              payment.status,
                            )}`}
                          >
                            {payment.status === PaymentStatus.PAID && (
                              <CheckCircle2 size={12} />
                            )}

                            {payment.status === PaymentStatus.PENDING && (
                              <Clock3 size={12} />
                            )}

                            {payment.status === PaymentStatus.REJECTED && (
                              <XCircle size={12} />
                            )}

                            {getPaymentStatusLabel(
                              payment.status,
                              payment.method,
                            )}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${getPaymentMethodClass(
                              payment.method,
                            )}`}
                          >
                            {isStripe ? (
                              <CreditCard size={12} />
                            ) : (
                              <Banknote size={12} />
                            )}

                            {getPaymentMethodLabel(payment.method)}
                          </span>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-600">
                              <ReceiptText size={12} />
                              Factură
                            </p>

                            <p className="mt-1.5 text-sm font-medium text-slate-300">
                              {monthNames[payment.invoice.month]}{" "}
                              {payment.invoice.year}
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-600">
                              <CalendarDays size={12} />
                              Înregistrată
                            </p>

                            <p className="mt-1.5 text-sm font-medium text-slate-300">
                              {payment.createdAt.toLocaleDateString("ro-RO")}
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 sm:col-span-2">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-600">
                              Email locatar
                            </p>

                            <p className="mt-1.5 truncate text-sm text-slate-400">
                              {payment.invoice.apartment.owner.email}
                            </p>
                          </div>
                        </div>

                        {payment.paidAt && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-emerald-300/70">
                            <CheckCircle2 size={14} />
                            Confirmată la{" "}
                            {payment.paidAt.toLocaleDateString("ro-RO")}
                          </div>
                        )}

                        {isStripe &&
                          payment.status === PaymentStatus.PENDING && (
                            <div className="mt-4 flex items-start gap-3 rounded-xl border border-violet-400/10 bg-violet-500/[0.045] p-3.5">
                              <ShieldCheck
                                size={17}
                                className="mt-0.5 shrink-0 text-violet-300"
                              />

                              <div>
                                <p className="text-sm font-medium text-violet-200">
                                  Procesare automată Stripe
                                </p>

                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                  Această plată este confirmată automat prin
                                  webhook și nu necesită intervenție manuală.
                                </p>
                              </div>
                            </div>
                          )}
                      </div>

                      <div className="shrink-0 lg:min-w-[190px] lg:text-right">
                        <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-600">
                          Valoare plată
                        </p>

                        <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-100">
                          {moneyFormatter.format(
                            Number(payment.amount.toString()),
                          )}
                          <span className="ml-1.5 text-sm font-medium text-slate-500">
                            RON
                          </span>
                        </p>

                        {canConfirmManually && (
                          <form action={confirmPaymentAction} className="mt-5">
                            <input
                              type="hidden"
                              name="paymentId"
                              value={payment.id}
                            />

                            <button
                              type="submit"
                              className="app-button-primary inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium lg:w-auto"
                            >
                              <CheckCircle2 size={16} />
                              Confirmă plata
                            </button>
                          </form>
                        )}

                        {!canConfirmManually &&
                          payment.status === PaymentStatus.PAID && (
                            <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.045] px-3 py-2 text-xs font-medium text-emerald-300">
                              <CheckCircle2 size={14} />
                              Finalizată
                            </div>
                          )}

                        {payment.status === PaymentStatus.REJECTED && (
                          <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-rose-400/10 bg-rose-400/[0.045] px-3 py-2 text-xs font-medium text-rose-300">
                            <XCircle size={14} />
                            Nefinalizată
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {payments.length > 0 && (
            <div className="border-t border-white/[0.06] px-6 py-4">
              <div className="flex items-start gap-2 text-xs leading-5 text-slate-600">
                <Info size={14} className="mt-0.5 shrink-0" />

                <p>
                  Plățile manuale aflate în așteptare pot fi confirmate de
                  administrator. Plățile Stripe sunt actualizate exclusiv prin
                  procesarea automată a providerului.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
