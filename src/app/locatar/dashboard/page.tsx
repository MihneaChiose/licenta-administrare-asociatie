import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/client";
import { getSession } from "@/lib/session";

export default async function TenantDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.TENANT) {
    redirect("/admin/dashboard");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">Dashboard locatar</h1>
        <p className="mt-2 text-gray-600">Bine ai venit, {session.name}.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Link
            href="/locatar/consum"
            className="rounded-2xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="font-semibold">Consum lunar</h2>
            <p className="mt-2 text-sm text-gray-600">
              Transmite consumul pentru luna curenta.
            </p>
          </Link>

          <Link
            href="/locatar/intretinere"
            className="rounded-2xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="font-semibold">Intretinere si plati</h2>
            <p className="mt-2 text-sm text-gray-600">
              Vezi intretinerea si statusul platilor.
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
        </div>
      </div>
    </main>
  );
}
