import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export default async function AdminApartmentsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.ADMIN) {
    redirect("/locatar/dashboard");
  }

  const apartments = await prisma.apartment.findMany({
    where: {
      association: {
        adminId: session.id,
      },
    },
    include: {
      owner: true,
      association: true,
    },
    orderBy: [
      {
        floor: "asc",
      },
      {
        number: "asc",
      },
    ],
  });

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/admin/dashboard"
              className="text-sm text-gray-600 hover:text-black"
            >
              Inapoi la dashboard
            </Link>

            <h1 className="mt-4 text-3xl font-bold text-gray-900">
              Apartamente si locatari
            </h1>

            <p className="mt-2 text-gray-600">
              Gestioneaza apartamentele din asociatie si locatarii asociati.
            </p>
          </div>

          <Link
            href="/admin/apartamente/new"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Adauga apartament
          </Link>
        </div>

        <div className="mt-8 rounded-2xl bg-white shadow">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Lista apartamente
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Total apartamente: {apartments.length}
            </p>
          </div>

          {apartments.length === 0 ? (
            <div className="p-6 text-sm text-gray-600">
              Nu exista apartamente inregistrate.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-6 py-3 font-medium">Apartament</th>
                    <th className="px-6 py-3 font-medium">Etaj</th>
                    <th className="px-6 py-3 font-medium">Suprafata</th>
                    <th className="px-6 py-3 font-medium">Persoane</th>
                    <th className="px-6 py-3 font-medium">Locatar</th>
                    <th className="px-6 py-3 font-medium">Email</th>
                    <th className="px-6 py-3 font-medium">Asociatie</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {apartments.map((apartment) => (
                    <tr key={apartment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        Ap. {apartment.number}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {apartment.floor}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {apartment.surface} mp
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {apartment.numberOfResidents}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {apartment.owner.name}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {apartment.owner.email}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {apartment.association.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
