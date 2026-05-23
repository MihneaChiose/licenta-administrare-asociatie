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
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="font-semibold">Locatari</h2>
            <p className="mt-2 text-sm text-gray-600">
              Gestionare locatari si apartamente.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="font-semibold">Cheltuieli</h2>
            <p className="mt-2 text-sm text-gray-600">
              Introducere si calcul cheltuieli lunare.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="font-semibold">Sesizari</h2>
            <p className="mt-2 text-sm text-gray-600">
              Monitorizare tichete trimise de locatari.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
