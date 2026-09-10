import { prisma } from "@/lib/prisma";
import { MaintenanceListStatus } from "@/generated/prisma/client";

const visibleMaintenanceStatuses = [
  MaintenanceListStatus.PUBLISHED,
  MaintenanceListStatus.CLOSED,
];

export async function getAdminDashboardStatistics(adminId: string) {
  const association = await prisma.association.findFirst({
    where: {
      adminId,
    },
    select: {
      id: true,
    },
  });

  if (!association) {
    return null;
  }

  const associationId = association.id;

  const apartments = await prisma.apartment.findMany({
    where: {
      associationId,
    },
    select: {
      id: true,
      numberOfResidents: true,
    },
  });

  const apartmentIds = apartments.map((apartment) => apartment.id);

  const totalApartments = apartments.length;

  const totalResidents = apartments.reduce(
    (total, apartment) => total + apartment.numberOfResidents,
    0,
  );

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const currentMonthStart = new Date(currentYear, now.getMonth(), 1);

  const nextMonthStart = new Date(currentYear, now.getMonth() + 1, 1);

  const expenses = await prisma.expense.aggregate({
    where: {
      associationId,
      month: currentMonth,
      year: currentYear,
    },
    _sum: {
      totalAmount: true,
    },
  });

  const unpaidInvoices = await prisma.invoice.count({
    where: {
      apartmentId: {
        in: apartmentIds,
      },

      status: "UNPAID",

      maintenanceList: {
        status: {
          in: visibleMaintenanceStatuses,
        },
      },
    },
  });

  const monthlyPayments = await prisma.payment.aggregate({
    where: {
      status: "PAID",

      paidAt: {
        gte: currentMonthStart,
        lt: nextMonthStart,
      },

      invoice: {
        apartmentId: {
          in: apartmentIds,
        },

        maintenanceList: {
          status: {
            in: visibleMaintenanceStatuses,
          },
        },
      },
    },

    _sum: {
      amount: true,
    },
  });

  const openTickets = await prisma.ticket.count({
    where: {
      apartmentId: {
        in: apartmentIds,
      },

      status: {
        in: ["OPEN", "IN_PROGRESS"],
      },
    },
  });

  return {
    totalApartments,
    totalResidents,
    totalExpenses: expenses._sum.totalAmount ?? 0,
    totalMonthlyPayments: monthlyPayments._sum.amount ?? 0,
    unpaidInvoices,
    openTickets,
  };
}
