import { redirect } from "next/navigation";
import { UtilityType, UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { submitMeterReadingsAction } from "./actions";
import { TenantLayout } from "@/components/layout/TenantLayout";
import { METER_UTILITY_CONFIG } from "@/lib/meters";

type MeterReadingsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

type ReadingHistoryRow = {
  month: number;
  year: number;
  submittedAt: Date;
  values: Partial<Record<UtilityType, string>>;
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

export default async function MeterReadingsPage({
  searchParams,
}: MeterReadingsPageProps) {
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
        title="Informații indisponibile"
        description="Contul tău nu este asociat momentan unui apartament."
      >
        <div className="rounded-2xl bg-white p-8 shadow">
          <p className="text-gray-600">
            Contul tău nu este asociat niciunui apartament. Contactează
            administratorul asociației.
          </p>
        </div>
      </TenantLayout>
    );
  }

  const meterReadings = await prisma.meterReading.findMany({
    where: {
      meter: {
        apartmentId: apartment.id,
      },
    },
    select: {
      month: true,
      year: true,
      readingValue: true,
      submittedAt: true,
      meter: {
        select: {
          utilityType: true,
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
        submittedAt: "desc",
      },
    ],
  });

  const historyMap = new Map<string, ReadingHistoryRow>();

  for (const reading of meterReadings) {
    const key = `${reading.year}-${reading.month}`;

    let historyRow = historyMap.get(key);

    if (!historyRow) {
      historyRow = {
        month: reading.month,
        year: reading.year,
        submittedAt: reading.submittedAt,
        values: {},
      };

      historyMap.set(key, historyRow);
    }

    historyRow.values[reading.meter.utilityType] =
      reading.readingValue.toFixed(3);

    if (reading.submittedAt > historyRow.submittedAt) {
      historyRow.submittedAt = reading.submittedAt;
    }
  }

  const readingHistory = Array.from(historyMap.values()).sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year;
    }

    return b.month - a.month;
  });

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  return (
    <TenantLayout
      title="Transmitere indexuri"
      description={`Apartamentul ${apartment.number} - ${apartment.association.name}`}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <section className="rounded-2xl bg-white p-8 shadow">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Indexuri contoare
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                Introdu indexul curent afișat de fiecare contor.
              </p>
            </div>

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

            <form action={submitMeterReadingsAction} className="mt-8 space-y-5">
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
                {METER_UTILITY_CONFIG.map((utility) => (
                  <div key={utility.utilityType}>
                    <label className="text-sm font-medium text-gray-700">
                      {utility.label} ({utility.unit})
                    </label>

                    <input
                      name={utility.fieldName}
                      type="number"
                      step="0.001"
                      min="0"
                      required
                      placeholder="Index curent"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-black px-4 py-2 font-medium text-white hover:bg-gray-800"
              >
                Trimite indexurile
              </button>
            </form>
          </section>

          <section className="rounded-2xl bg-white shadow">
            <div className="border-b border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Istoric indexuri
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                Indexurile transmise pentru apartamentul tău.
              </p>
            </div>

            {readingHistory.length === 0 ? (
              <div className="p-6 text-sm text-gray-600">
                Nu ai transmis încă niciun index.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-6 py-3 font-medium">Luna</th>

                      {METER_UTILITY_CONFIG.map((utility) => (
                        <th
                          key={utility.utilityType}
                          className="px-6 py-3 font-medium"
                        >
                          {utility.label}
                        </th>
                      ))}

                      <th className="px-6 py-3 font-medium">Transmis la</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {readingHistory.map((row) => (
                      <tr
                        key={`${row.year}-${row.month}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {monthNames[row.month]} {row.year}
                        </td>

                        {METER_UTILITY_CONFIG.map((utility) => (
                          <td
                            key={utility.utilityType}
                            className="px-6 py-4 text-gray-700"
                          >
                            {row.values[utility.utilityType] ?? "-"}{" "}
                            {utility.unit}
                          </td>
                        ))}

                        <td className="px-6 py-4 text-gray-700">
                          {row.submittedAt.toLocaleDateString("ro-RO")}
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
