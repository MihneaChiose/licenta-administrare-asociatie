import {
  CalendarDays,
  CircleGauge,
  Clock3,
  Gauge,
  UsersRound,
} from "lucide-react";
import { redirect } from "next/navigation";
import { UtilityType, UserRole } from "@/generated/prisma/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { TENANT_METER_UTILITY_CONFIG } from "@/lib/meters";

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

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const tenantUtilityTypes = TENANT_METER_UTILITY_CONFIG.map(
    (utility) => utility.utilityType,
  );

  const [meterReadings, totalApartments, currentMonthReadings] =
    await Promise.all([
      prisma.meterReading.findMany({
        where: {
          meter: {
            utilityType: {
              in: tenantUtilityTypes,
            },

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
      }),

      prisma.apartment.count({
        where: {
          association: {
            adminId: session.id,
          },
        },
      }),

      prisma.meterReading.findMany({
        where: {
          month: currentMonth,
          year: currentYear,

          meter: {
            utilityType: {
              in: tenantUtilityTypes,
            },

            apartment: {
              association: {
                adminId: session.id,
              },
            },
          },
        },

        select: {
          meter: {
            select: {
              apartmentId: true,
            },
          },
        },
      }),
    ]);

  const currentMonthApartmentsWithReadings = new Set(
    currentMonthReadings.map((reading) => reading.meter.apartmentId),
  ).size;

  const readingMap = new Map<string, AdminReadingRow>();

  for (const reading of meterReadings) {
    const apartment = reading.meter.apartment;

    const utility = TENANT_METER_UTILITY_CONFIG.find(
      (config) => config.utilityType === reading.meter.utilityType,
    );

    if (!utility) {
      continue;
    }

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

    row.values[reading.meter.utilityType] = reading.readingValue.toFixed(
      utility.decimals,
    );

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
    <AdminLayout title="Indexuri contoare">
      <div className="mx-auto max-w-7xl space-y-8">
        <section>
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.7)]" />

              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                Monitorizare
              </p>
            </div>

            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-100">
              Situatie indexuri
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-violet-500/[0.08] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Transmiteri luna aceasta
                  </p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {currentMonthApartmentsWithReadings}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Apartamente cu indexuri transmise
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/10">
                  <Gauge size={20} strokeWidth={1.8} />
                </div>
              </div>
            </div>

            <div className="app-card relative overflow-hidden p-5">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-400/[0.07] blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Apartamente
                  </p>

                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
                    {totalApartments}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Total apartamente
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/10">
                  <UsersRound size={20} strokeWidth={1.8} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="app-card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-white/[0.07] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.65)]" />

                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400">
                  Registru
                </p>
              </div>

              <h2 className="mt-2 text-lg font-semibold text-slate-100">
                Lista indexuri
              </h2>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs text-slate-500">
              <CircleGauge size={15} />
              Evidenta consumuri
            </div>
          </div>

          {readingRows.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-slate-500">
                <Gauge size={24} strokeWidth={1.7} />
              </div>

              <h3 className="mt-4 font-medium text-slate-300">
                Nu exista indexuri transmise
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Indexurile trimise de locatari vor aparea aici, grupate pe
                apartament si perioada.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.025]">
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Luna
                    </th>

                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Apartament
                    </th>

                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Locatar
                    </th>

                    {TENANT_METER_UTILITY_CONFIG.map((utility) => (
                      <th
                        key={utility.utilityType}
                        className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500"
                      >
                        {utility.label}
                      </th>
                    ))}

                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Transmis la
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.055]">
                  {readingRows.map((row) => (
                    <tr
                      key={`${row.apartmentId}-${row.year}-${row.month}`}
                      className="transition-colors duration-150 hover:bg-violet-500/[0.035]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/10">
                            <CalendarDays size={16} />
                          </div>

                          <div>
                            <p className="font-medium text-slate-200">
                              {monthNames[row.month]}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              {row.year}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-lg border border-white/[0.07] bg-white/[0.035] px-2.5 py-1 text-xs font-medium text-slate-300">
                          {row.apartmentNumber}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-300">
                          {row.tenantName}
                        </p>
                      </td>

                      {TENANT_METER_UTILITY_CONFIG.map((utility) => {
                        const value = row.values[utility.utilityType];

                        return (
                          <td key={utility.utilityType} className="px-6 py-4">
                            {value ? (
                              <div className="inline-flex items-baseline gap-1.5">
                                <span className="font-semibold tabular-nums text-slate-200">
                                  {value}
                                </span>

                                <span className="text-xs text-slate-500">
                                  {utility.unit}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-700">—</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Clock3 size={15} className="text-slate-600" />

                          <span>
                            {row.submittedAt.toLocaleDateString("ro-RO")}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
