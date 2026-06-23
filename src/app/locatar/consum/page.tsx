import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { submitConsumptionAction } from "./actions";
import { TenantLayout } from "@/components/layout/TenantLayout";

type ConsumptionPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

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

export default async function ConsumptionPage({
  searchParams,
}: ConsumptionPageProps) {
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

  const consumptions = await prisma.consumption.findMany({
    where: {
      apartmentId: apartment.id,
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

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  return (
    <TenantLayout
      title="Transmitere consum"
      description={`Apartamentul ${apartment.number} - ${apartment.association.name}`}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <section className="rounded-2xl bg-white p-8 shadow">
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

            <form action={submitConsumptionAction} className="mt-8 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Luna
                  </label>
                  <select
                    name="month"
                    defaultValue={currentMonth}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                  >
                    {Object.entries(monthNames).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    An
                  </label>
                  <input
                    name="year"
                    type="number"
                    defaultValue={currentYear}
                    required
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Apa rece
                  </label>
                  <input
                    name="coldWater"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue="0"
                    required
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Apa calda
                  </label>
                  <input
                    name="hotWater"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue="0"
                    required
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Gaze
                  </label>
                  <input
                    name="gas"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue="0"
                    required
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Electricitate
                  </label>
                  <input
                    name="electricity"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue="0"
                    required
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    Caldura
                  </label>
                  <input
                    name="heating"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue="0"
                    required
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-black px-4 py-2 font-medium text-white hover:bg-gray-800"
              >
                Trimite consumul
              </button>
            </form>
          </section>

          <section className="rounded-2xl bg-white shadow">
            <div className="border-b border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Istoric consumuri
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Consumurile transmise pentru apartamentul tau.
              </p>
            </div>

            {consumptions.length === 0 ? (
              <div className="p-6 text-sm text-gray-600">
                Nu ai transmis inca niciun consum.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-6 py-3 font-medium">Luna</th>
                      <th className="px-6 py-3 font-medium">Apa rece</th>
                      <th className="px-6 py-3 font-medium">Apa calda</th>
                      <th className="px-6 py-3 font-medium">Gaze</th>
                      <th className="px-6 py-3 font-medium">Electricitate</th>
                      <th className="px-6 py-3 font-medium">Caldura</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {consumptions.map((consumption) => (
                      <tr key={consumption.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {monthNames[consumption.month]} {consumption.year}
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </TenantLayout>
  );
}
