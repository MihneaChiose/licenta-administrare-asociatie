import { redirect } from "next/navigation";
import { PaymentStatus, UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { confirmPaymentAction } from "./actions";
import { AdminLayout } from "@/components/layout/AdminLayout";

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

function getPaymentStatusLabel(status: PaymentStatus, method: string) {
  if (status === PaymentStatus.PAID) {
    return "Confirmata";
  }

  if (status === PaymentStatus.REJECTED) {
    return method === PAYMENT_METHOD_STRIPE
      ? "Expirata / nereusita"
      : "Respinsa";
  }

  return method === PAYMENT_METHOD_STRIPE
    ? "In procesare Stripe"
    : "In asteptare";
}

function getPaymentStatusClass(status: PaymentStatus) {
  if (status === PaymentStatus.PAID) {
    return "bg-green-50 text-green-700";
  }

  if (status === PaymentStatus.REJECTED) {
    return "bg-red-50 text-red-700";
  }

  return "bg-yellow-50 text-yellow-700";
}

function getPaymentMethodLabel(method: string) {
  if (method === PAYMENT_METHOD_STRIPE) {
    return "Plata online - Stripe";
  }

  if (method === PAYMENT_METHOD_MANUAL) {
    return "Plata manuala";
  }

  return method;
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

  return (
    <AdminLayout
      title="Plati locatari"
      description="Urmareste platile manuale si online aferente intretinerii locatarilor."
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

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-sm font-medium text-gray-500">Plati totale</h2>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {payments.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-sm font-medium text-gray-500">
              In asteptare / procesare
            </h2>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {pendingPayments.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-sm font-medium text-gray-500">Confirmate</h2>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {confirmedPayments.length}
            </p>
          </div>
        </div>

        <section className="mt-8 rounded-2xl bg-white shadow">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Lista plati</h2>

            <p className="mt-1 text-sm text-gray-600">
              Total inregistrari: {payments.length}
            </p>
          </div>

          {payments.length === 0 ? (
            <div className="p-6 text-sm text-gray-600">
              Nu exista plati inregistrate.
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {payments.map((payment) => (
                <article
                  key={payment.id}
                  className="rounded-2xl border border-gray-200 p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Ap. {payment.invoice.apartment.number} -{" "}
                          {payment.invoice.apartment.owner.name}
                        </h3>

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getPaymentStatusClass(
                            payment.status,
                          )}`}
                        >
                          {getPaymentStatusLabel(
                            payment.status,
                            payment.method,
                          )}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-gray-600">
                        Factura: {monthNames[payment.invoice.month]}{" "}
                        {payment.invoice.year}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        Email locatar: {payment.invoice.apartment.owner.email}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        Metoda: {getPaymentMethodLabel(payment.method)}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Inregistrata la{" "}
                        {payment.createdAt.toLocaleDateString("ro-RO")}
                      </p>

                      {payment.paidAt && (
                        <p className="mt-1 text-sm text-gray-500">
                          Confirmata la{" "}
                          {payment.paidAt.toLocaleDateString("ro-RO")}
                        </p>
                      )}

                      {payment.method === PAYMENT_METHOD_STRIPE &&
                        payment.status === PaymentStatus.PENDING && (
                          <p className="mt-2 text-sm text-yellow-700">
                            Plata este procesata automat prin Stripe. Nu
                            necesita confirmare manuala.
                          </p>
                        )}
                    </div>

                    <div className="text-left lg:text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {payment.amount.toString()} RON
                      </p>

                      {payment.status === PaymentStatus.PENDING &&
                        payment.method === PAYMENT_METHOD_MANUAL && (
                          <form action={confirmPaymentAction} className="mt-4">
                            <input
                              type="hidden"
                              name="paymentId"
                              value={payment.id}
                            />

                            <button
                              type="submit"
                              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                            >
                              Confirma plata
                            </button>
                          </form>
                        )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
