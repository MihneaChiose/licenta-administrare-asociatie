import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/client";
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
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">Dashboard administrator</h1>
        <p className="mt-2 text-gray-600">Bine ai venit, {session.name}.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Link
            href="/admin/apartamente"
            className="rounded-2xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="font-semibold">Locatari</h2>
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
              Introducere si calcul cheltuieli lunare.
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
            href="/admin/avizier"
            className="rounded-2xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="font-semibold">Avizier</h2>
            <p className="mt-2 text-sm text-gray-600">
              Publicare anunturi pentru locatari.
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
        </div>
      </div>
    </main>
  );
}
