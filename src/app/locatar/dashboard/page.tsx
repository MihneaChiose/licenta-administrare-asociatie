import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/client";
import { TenantLayout } from "@/components/layout/TenantLayout";
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
    <TenantLayout
      title="Dashboard locatar"
      description={`Bine ai venit, ${session.name}.`}
    >
      <div className="grid gap-4 md:grid-cols-3">
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
    </TenantLayout>
  );
}
