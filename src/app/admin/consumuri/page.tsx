import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { AdminLayout } from "@/components/layout/AdminLayout";

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

export default async function AdminConsumptionsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.ADMIN) {
    redirect("/locatar/dashboard");
  }

  const consumptions = await prisma.consumption.findMany({
    where: {
      apartment: {
        association: {
          adminId: session.id,
        },
      },
    },
    include: {
      apartment: {
        include: {
          owner: true,
          association: true,
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
      {
        apartment: {
          number: "asc",
        },
      },
    ],
  });

  return (
    <AdminLayout
      title="Consumuri transmise"
      description="Vizualizeaza consumurile lunare trimise de locatarii din asociatia administrata."
    >
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl bg-white shadow">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Lista consumuri
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Total inregistrari: {consumptions.length}
            </p>
          </div>

          {consumptions.length === 0 ? (
            <div className="p-6 text-sm text-gray-600">
              Nu exista consumuri transmise pana acum.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-6 py-3 font-medium">Luna</th>
                    <th className="px-6 py-3 font-medium">Apartament</th>
                    <th className="px-6 py-3 font-medium">Locatar</th>
                    <th className="px-6 py-3 font-medium">Apa rece</th>
                    <th className="px-6 py-3 font-medium">Apa calda</th>
                    <th className="px-6 py-3 font-medium">Gaze</th>
                    <th className="px-6 py-3 font-medium">Electricitate</th>
                    <th className="px-6 py-3 font-medium">Caldura</th>
                    <th className="px-6 py-3 font-medium">Transmis la</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {consumptions.map((consumption) => (
                    <tr key={consumption.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {monthNames[consumption.month]} {consumption.year}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        Ap. {consumption.apartment.number}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {consumption.apartment.owner.name}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {consumption.coldWater}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {consumption.hotWater}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {consumption.gas}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {consumption.electricity}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {consumption.heating}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {consumption.submittedAt.toLocaleDateString("ro-RO")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
