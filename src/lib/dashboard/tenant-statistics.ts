import { prisma } from "@/lib/prisma";
import {
  TENANT_METER_UTILITY_CONFIG,
  TENANT_REQUIRED_METER_COUNT,
} from "@/lib/meters";
import { MaintenanceListStatus } from "@/generated/prisma/client";

const visibleMaintenanceStatuses = [
  MaintenanceListStatus.PUBLISHED,
  MaintenanceListStatus.CLOSED,
];

export async function getTenantDashboardStatistics(tenantId: string) {
  const apartment = await prisma.apartment.findFirst({
    where: {
      ownerId: tenantId,
    },

    select: {
      id: true,
      number: true,
      floor: true,
      numberOfResidents: true,
    },
  });

  if (!apartment) {
    return null;
  }

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const tenantUtilityTypes = TENANT_METER_UTILITY_CONFIG.map(
    (utility) => utility.utilityType,
  );

  const currentMeterReadingCount = await prisma.meterReading.count({
    where: {
      month: currentMonth,
      year: currentYear,

      meter: {
        apartmentId: apartment.id,

        utilityType: {
          in: tenantUtilityTypes,
        },
      },
    },
  });

  const currentInvoice = await prisma.invoice.findFirst({
    where: {
      apartmentId: apartment.id,
      month: currentMonth,
      year: currentYear,

      maintenanceList: {
        status: {
          in: visibleMaintenanceStatuses,
        },
      },
    },

    select: {
      totalAmount: true,
      status: true,
    },
  });

  const unpaidInvoices = await prisma.invoice.count({
    where: {
      apartmentId: apartment.id,
      status: "UNPAID",

      maintenanceList: {
        status: {
          in: visibleMaintenanceStatuses,
        },
      },
    },
  });

  const activeTickets = await prisma.ticket.count({
    where: {
      apartmentId: apartment.id,

      status: {
        in: ["OPEN", "IN_PROGRESS"],
      },
    },
  });

  return {
    apartmentNumber: apartment.number,
    floor: apartment.floor,
    numberOfResidents: apartment.numberOfResidents,

    meterReadingsSubmitted:
      currentMeterReadingCount === TENANT_REQUIRED_METER_COUNT,

    currentMaintenanceAmount: currentInvoice?.totalAmount ?? 0,

    currentInvoiceStatus: currentInvoice?.status ?? null,

    unpaidInvoices,
    activeTickets,
  };
}
