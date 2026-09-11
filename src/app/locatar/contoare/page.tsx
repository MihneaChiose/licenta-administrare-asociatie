import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Gauge,
  TriangleAlert,
} from "lucide-react";
import { redirect } from "next/navigation";
import { UtilityType, UserRole } from "@/generated/prisma/client";
import { TenantLayout } from "@/components/layout/TenantLayout";
import { TENANT_METER_UTILITY_CONFIG } from "@/lib/meters";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { MeterReadingForm } from "./MeterReadingForm";

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
  });

  if (!apartment) {
    return (
      <TenantLayout title="Informații indisponibile">
        <div className="mx-auto max-w-4xl">
          <div className="app-card relative overflow-hidden p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-400/[0.05] blur-3xl" />

            <div className="relative flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/[0.08] text-amber-300 ring-1 ring-amber-400/10">
                <TriangleAlert size={22} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-200">
                  Apartament indisponibil
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Contul tău nu este asociat niciunui apartament. Contactează
                  administratorul asociației pentru configurarea accesului.
                </p>
              </div>
            </div>
          </div>
        </div>
      </TenantLayout>
    );
  }

  const tenantUtilityTypes = TENANT_METER_UTILITY_CONFIG.map(
    (utility) => utility.utilityType,
  );

  const meterReadings = await prisma.meterReading.findMany({
    where: {
      meter: {
        apartmentId: apartment.id,

        utilityType: {
          in: tenantUtilityTypes,
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
    const utility = TENANT_METER_UTILITY_CONFIG.find(
      (config) => config.utilityType === reading.meter.utilityType,
    );

    if (!utility) {
      continue;
    }

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

    historyRow.values[reading.meter.utilityType] = reading.readingValue.toFixed(
      utility.decimals,
    );

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
    <TenantLayout title="Transmitere indexuri">
      <div className="mx-auto max-w-7xl pt-2">
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.45fr]">
          <section className="app-card relative h-fit overflow-hidden">
            <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-violet-500/[0.055] blur-3xl" />

            <div className="relative border-b border-white/[0.07] px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/10">
                  <Gauge size={19} />
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                    Transmitere
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-slate-100">
                    Transmitere index
                  </h2>
                </div>
              </div>
            </div>

            <div className="relative p-6">
              {params.error && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-400/15 bg-rose-500/[0.08] p-4 text-sm leading-6 text-rose-300">
                  <TriangleAlert size={18} className="mt-0.5 shrink-0" />

                  <p>{params.error}</p>
                </div>
              )}

              {params.success && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-400/15 bg-emerald-500/[0.08] p-4 text-sm text-emerald-300">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" />

                  <p>{params.success}</p>
                </div>
              )}

              <MeterReadingForm
                currentMonth={currentMonth}
                currentYear={currentYear}
                utilities={TENANT_METER_UTILITY_CONFIG.map((utility) => ({
                  utilityType: utility.utilityType,
                  label: utility.label,
                  unit: utility.unit,
                  decimals: utility.decimals,
                }))}
              />
            </div>
          </section>

          <section className="app-card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-white/[0.07] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.65)]" />

                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400">
                    Consumption history
                  </p>
                </div>

                <h2 className="mt-2 text-lg font-semibold text-slate-100">
                  Istoric indexuri
                </h2>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs text-slate-500">
                <Gauge size={14} />
                {readingHistory.length} perioade
              </div>
            </div>

            {readingHistory.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-slate-500">
                  <Gauge size={24} strokeWidth={1.7} />
                </div>

                <h3 className="mt-4 font-medium text-slate-300">
                  Nu ai transmis încă niciun index
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  După prima transmitere, valorile contoarelor vor apărea aici
                  grupate pe lună.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.025]">
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Perioada
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
                    {readingHistory.map((row) => (
                      <tr
                        key={`${row.year}-${row.month}`}
                        className="transition-colors duration-150 hover:bg-violet-500/[0.03]"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03] text-slate-500 ring-1 ring-white/[0.05]">
                              <CalendarDays size={16} />
                            </div>

                            <div>
                              <p className="font-medium text-slate-200">
                                {monthNames[row.month]}
                              </p>

                              <span className="mt-0.5 text-xs text-slate-500">
                                {row.year}
                              </span>
                            </div>
                          </div>
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

                                  <span className="text-xs text-slate-600">
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
                            <Clock3 size={14} className="text-slate-600" />

                            {row.submittedAt.toLocaleDateString("ro-RO")}
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
      </div>
    </TenantLayout>
  );
}
