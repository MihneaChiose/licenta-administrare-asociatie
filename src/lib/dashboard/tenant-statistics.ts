import { prisma } from "@/lib/prisma";

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

  const currentConsumption = await prisma.consumption.findUnique({
    where: {
      apartmentId_month_year: {
        apartmentId: apartment.id,
        month: currentMonth,
        year: currentYear,
      },
    },
    select: {
      id: true,
    },
  });

  const currentInvoice = await prisma.invoice.findUnique({
    where: {
      apartmentId_month_year: {
        apartmentId: apartment.id,
        month: currentMonth,
        year: currentYear,
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
    consumptionSubmitted: currentConsumption !== null,
    currentMaintenanceAmount: currentInvoice?.totalAmount ?? 0,
    currentInvoiceStatus: currentInvoice?.status ?? null,
    unpaidInvoices,
    activeTickets,
  };
}
