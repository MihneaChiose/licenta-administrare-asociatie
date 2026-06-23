import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { getSession } from "@/lib/session";

export default async function AdminDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.ADMIN) {
    redirect("/locatar/dashboard");
  }

  return (
    <AdminLayout
      title="Dashboard administrator"
      description={`Bine ai venit, ${session.name}.`}
    >
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
    </AdminLayout>
  );
}
