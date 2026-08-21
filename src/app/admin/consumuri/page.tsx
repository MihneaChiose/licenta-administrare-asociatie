import { redirect } from "next/navigation";
import { UtilityType, UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { METER_UTILITY_CONFIG } from "@/lib/meters";

type AdminReadingRow = {
  apartmentId: string;
  apartmentNumber: string;
  tenantName: string;
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

export default async function AdminMeterReadingsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.ADMIN) {
    redirect("/locatar/dashboard");
  }

  const meterReadings = await prisma.meterReading.findMany({
    where: {
      meter: {
        apartment: {
          association: {
            adminId: session.id,
          },
        },
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
          apartment: {
            select: {
              id: true,
              number: true,
              owner: {
                select: {
                  name: true,
                },
              },
            },
          },
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
    ],
  });

  const readingMap = new Map<string, AdminReadingRow>();

  for (const reading of meterReadings) {
    const apartment = reading.meter.apartment;

    const key = `${apartment.id}-${reading.year}-${reading.month}`;

    let row = readingMap.get(key);

    if (!row) {
      row = {
        apartmentId: apartment.id,
        apartmentNumber: apartment.number,
        tenantName: apartment.owner.name,
        month: reading.month,
        year: reading.year,
        submittedAt: reading.submittedAt,
        values: {},
      };

      readingMap.set(key, row);
    }

    row.values[reading.meter.utilityType] = reading.readingValue.toFixed(3);

    if (reading.submittedAt > row.submittedAt) {
      row.submittedAt = reading.submittedAt;
    }
  }

  const readingRows = Array.from(readingMap.values()).sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year;
    }

    if (a.month !== b.month) {
      return b.month - a.month;
    }

    return a.apartmentNumber.localeCompare(b.apartmentNumber, "ro", {
      numeric: true,
    });
  });

  return (
    <AdminLayout
      title="Indexuri contoare"
      description="Vizualizează indexurile lunare transmise de locatarii din asociația administrată."
    >
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl bg-white shadow">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Lista indexuri
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Total transmiteri: {readingRows.length}
            </p>
          </div>

          {readingRows.length === 0 ? (
            <div className="p-6 text-sm text-gray-600">
              Nu există indexuri transmise până acum.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-6 py-3 font-medium">Luna</th>
                    <th className="px-6 py-3 font-medium">Apartament</th>
                    <th className="px-6 py-3 font-medium">Locatar</th>

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
                  {readingRows.map((row) => (
                    <tr
                      key={`${row.apartmentId}-${row.year}-${row.month}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {monthNames[row.month]} {row.year}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        Ap. {row.apartmentNumber}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {row.tenantName}
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
        </div>
      </div>
    </AdminLayout>
  );
}
