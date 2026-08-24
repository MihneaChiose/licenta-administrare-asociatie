import { redirect } from "next/navigation";
import {
  InvoiceStatus,
  MaintenanceListStatus,
  UserRole,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { requestPaymentAction } from "./actions";
import { TenantLayout } from "@/components/layout/TenantLayout";
import { InvoiceCalculationDetails } from "@/components/maintenance/InvoiceCalculationDetails";

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

function getStatusClass(status: InvoiceStatus) {
  if (status === InvoiceStatus.PAID) {
    return "bg-green-50 text-green-700";
  }

  if (status === InvoiceStatus.PENDING) {
    return "bg-yellow-50 text-yellow-700";
  }

  if (status === InvoiceStatus.CANCELLED) {
    return "bg-red-50 text-red-700";
  }

  return "bg-gray-100 text-gray-700";
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
      <TenantLayout
        title="Informatii indisponibile"
        description="Contul tau nu este asociat momentan unui apartament."
      >
        <div className="rounded-2xl bg-white p-8 shadow">
          <p className="text-gray-600">
            Contul tau nu este asociat niciunui apartament. Contacteaza
            administratorul asociatiei.
          </p>
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

      payments: {
        orderBy: {
          createdAt: "desc",
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
    <TenantLayout
      title="Intretinerea mea"
      description={`Facturi si plati pentru Apartamentul ${apartment.number}`}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mt-6">
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
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-sm font-medium text-gray-500">
              Facturi totale
            </h2>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {invoices.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-sm font-medium text-gray-500">
              Facturi neplatite
            </h2>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {unpaidInvoices.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-sm font-medium text-gray-500">
              Total de plata
            </h2>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalUnpaid.toFixed(2)} RON
            </p>
          </div>
        </div>

        <section className="mt-8 rounded-2xl bg-white shadow">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Istoric intretinere
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Vezi sumele lunare generate pentru apartamentul tau.
            </p>
          </div>

          {invoices.length === 0 ? (
            <div className="p-6 text-sm text-gray-600">
              Nu exista facturi generate pentru apartamentul tau.
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {invoices.map((invoice) => (
                <article
                  key={invoice.id}
                  className="rounded-2xl border border-gray-200 p-6"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {monthNames[invoice.month]} {invoice.year}
                      </h3>

                      <p className="mt-1 text-sm text-gray-600">
                        Generata la{" "}
                        {invoice.generatedAt.toLocaleDateString("ro-RO")}
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {invoice.totalAmount.toString()} RON
                      </p>

                      <span
                        className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                          invoice.status,
                        )}`}
                      >
                        {invoiceStatusLabels[invoice.status]}
                      </span>

                      {invoice.status === InvoiceStatus.UNPAID && (
                        <form action={requestPaymentAction} className="mt-4">
                          <input
                            type="hidden"
                            name="invoiceId"
                            value={invoice.id}
                          />

                          <button
                            type="submit"
                            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                          >
                            Trimite cerere de plata
                          </button>
                        </form>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900">
                        Detalierea întreținerii
                      </h4>

                      <p className="mt-1 text-sm text-gray-600">
                        Vezi baza și metoda folosite pentru calculul fiecărei
                        poziții.
                      </p>
                    </div>

                    <InvoiceCalculationDetails items={invoice.items} />
                  </div>

                  {invoice.payments.length > 0 && (
                    <div className="mt-6 rounded-lg bg-gray-50 p-4">
                      <h4 className="text-sm font-semibold text-gray-900">
                        Plati asociate
                      </h4>

                      <div className="mt-3 space-y-2">
                        {invoice.payments.map((payment) => (
                          <div
                            key={payment.id}
                            className="flex justify-between text-sm text-gray-700"
                          >
                            <span>
                              {payment.method} - {payment.status}
                            </span>
                            <span>{payment.amount.toString()} RON</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </TenantLayout>
  );
}
