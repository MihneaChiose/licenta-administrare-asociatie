import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { getSession } from "@/lib/session";
import { getAdminDashboardStatistics } from "@/lib/dashboard/admin-statistics";
import { StatisticsCard } from "@/components/dashboard/StatisticsCard";

export default async function AdminDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.ADMIN) {
    redirect("/locatar/dashboard");
  }

  const statistics = await getAdminDashboardStatistics(session.id);

  if (!statistics) {
    return (
      <AdminLayout
        title="Dashboard administrator"
        description={`Bine ai venit, ${session.name}.`}
      >
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Asociație indisponibilă
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Contul dumneavoastră de administrator nu este asociat momentan unei
            asociații.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Dashboard administrator"
      description={`Bine ai venit, ${session.name}.`}
    >
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Situație generală
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatisticsCard
            title="Apartamente"
            value={statistics.totalApartments}
            description="Apartamente administrate"
          />

          <StatisticsCard
            title="Locatari"
            value={statistics.totalResidents}
            description="Persoane declarate în apartamente"
          />

          <StatisticsCard
            title="Cheltuieli luna aceasta"
            value={`${Number(statistics.totalExpenses).toFixed(2)} RON`}
            description="Total cheltuieli în luna curentă"
          />

          <StatisticsCard
            title="Facturi restante"
            value={statistics.unpaidInvoices}
            description="Facturi neachitate"
          />

          <StatisticsCard
            title="Plăți în așteptare"
            value={statistics.pendingPayments}
            description="Plăți care necesită verificare"
          />

          <StatisticsCard
            title="Sesizări active"
            value={statistics.openTickets}
            description="Sesizări deschise sau în lucru"
          />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Gestionare</h2>

        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/admin/apartamente"
            className="rounded-2xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="font-semibold">Apartamente</h2>
            <p className="mt-2 text-sm text-gray-600">
              Gestionare locatari si apartamente.
            </p>
          </Link>

          <Link
            href="/admin/consumuri"
            className="rounded-2xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="font-semibold">Consumuri</h2>
            <p className="mt-2 text-sm text-gray-600">
              Vizualizare consumuri transmise de locatari.
            </p>
          </Link>

          <Link
            href="/admin/cheltuieli"
            className="rounded-2xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="font-semibold">Cheltuieli</h2>
            <p className="mt-2 text-sm text-gray-600">
              Introducere cheltuieli lunare.
            </p>
          </Link>

          <Link
            href="/admin/intretinere"
            className="rounded-2xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="font-semibold">Intretinere</h2>
            <p className="mt-2 text-sm text-gray-600">
              Generare automata a listelor lunare de plata.
            </p>
          </Link>

          <Link
            href="/admin/plati"
            className="rounded-2xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="font-semibold">Plati</h2>
            <p className="mt-2 text-sm text-gray-600">
              Confirmare plati transmise de locatari.
            </p>
          </Link>

          <Link
            href="/admin/sesizari"
            className="rounded-2xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="font-semibold">Sesizari</h2>
            <p className="mt-2 text-sm text-gray-600">
              Monitorizare tichete trimise de locatari.
            </p>
          </Link>

          <Link
            href="/admin/avizier"
            className="rounded-2xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="font-semibold">Avizier</h2>
            <p className="mt-2 text-sm text-gray-600">
              Publicare anunturi pentru locatari.
            </p>
          </Link>
        </div>
      </section>
    </AdminLayout>
  );
}
