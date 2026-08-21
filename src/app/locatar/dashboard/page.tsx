import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/client";
import { TenantLayout } from "@/components/layout/TenantLayout";
import { getSession } from "@/lib/session";
import { getTenantDashboardStatistics } from "@/lib/dashboard/tenant-statistics";
import { StatisticsCard } from "@/components/dashboard/StatisticsCard";

export default async function TenantDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.TENANT) {
    redirect("/admin/dashboard");
  }

  const statistics = await getTenantDashboardStatistics(session.id);

  if (!statistics) {
    return (
      <TenantLayout
        title="Dashboard locatar"
        description={`Bine ai venit, ${session.name}.`}
      >
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Apartament indisponibil
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Contul dumneavoastră nu este asociat momentan unui apartament.
          </p>
        </div>
      </TenantLayout>
    );
  }

  return (
    <TenantLayout
      title="Dashboard locatar"
      description={`Bine ai venit, ${session.name}.`}
    >
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Situația apartamentului
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatisticsCard
            title="Apartament"
            value={statistics.apartmentNumber}
            description={`Etajul ${statistics.floor}`}
          />

          <StatisticsCard
            title="Locatari"
            value={statistics.numberOfResidents}
            description="Persoane declarate în apartament"
          />

          <StatisticsCard
            title="Indexuri lunare"
            value={
              statistics.meterReadingsSubmitted ? "Transmise" : "Netransmise"
            }
            description="Indexuri pentru luna curentă"
          />

          <StatisticsCard
            title="Întreținere curentă"
            value={`${Number(statistics.currentMaintenanceAmount).toFixed(
              2,
            )} RON`}
            description="Total pentru luna curentă"
          />

          <StatisticsCard
            title="Facturi restante"
            value={statistics.unpaidInvoices}
            description="Facturi neachitate"
          />

          <StatisticsCard
            title="Sesizări active"
            value={statistics.activeTickets}
            description="Sesizări deschise sau în lucru"
          />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Acces rapid
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/locatar/consum"
            className="rounded-2xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="font-semibold">Indexuri contoare</h2>
            <p className="mt-2 text-sm text-gray-600">
              Transmite indexurile contoarelor pentru luna curentă.
            </p>
          </Link>

          <Link
            href="/locatar/intretinere"
            className="rounded-2xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="font-semibold">Intretinere si plati</h2>
            <p className="mt-2 text-sm text-gray-600">
              Vezi intretinerea si trimite cereri de plata.
            </p>
          </Link>

          <Link
            href="/locatar/sesizari"
            className="rounded-2xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="font-semibold">Sesizari</h2>
            <p className="mt-2 text-sm text-gray-600">
              Trimite si urmareste sesizari.
            </p>
          </Link>

          <Link
            href="/locatar/avizier"
            className="rounded-2xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="font-semibold">Avizier virtual</h2>
            <p className="mt-2 text-sm text-gray-600">
              Vezi anunturile publicate de administrator.
            </p>
          </Link>
        </div>
      </section>
    </TenantLayout>
  );
}
