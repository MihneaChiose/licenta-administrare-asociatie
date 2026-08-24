"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { MaintenanceListStatus, UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getPreviousPeriod } from "@/lib/meters";
import { getSession } from "@/lib/session";
import { calculateMaintenance } from "@/services/maintenance/calculate-maintenance";
import { MaintenanceCalculationError } from "@/services/maintenance/errors";
import { toMoneyString } from "@/services/maintenance/utils";
import {
  formatMaintenanceValidationIssues,
  validateMaintenanceGeneration,
} from "@/services/maintenance/validate-maintenance";

const periodSchema = z.object({
  month: z.coerce
    .number()
    .int("Luna trebuie să fie număr întreg")
    .min(1, "Luna trebuie să fie între 1 și 12")
    .max(12, "Luna trebuie să fie între 1 și 12"),

  year: z.coerce
    .number()
    .int("Anul trebuie să fie număr întreg")
    .min(2024, "Anul este prea mic")
    .max(2100, "Anul este prea mare"),
});

const maintenanceListSchema = z.object({
  maintenanceListId: z.string().min(1, "Lista este invalidă"),
});

async function getAdminAssociation(adminId: string) {
  return prisma.association.findFirst({
    where: {
      adminId,
    },
    select: {
      id: true,
    },
  });
}

export async function calculateMaintenanceListAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.ADMIN) {
    redirect("/locatar/dashboard");
  }

  const parsed = periodSchema.safeParse({
    month: formData.get("month"),
    year: formData.get("year"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Date invalide";

    redirect(`/admin/intretinere?error=${encodeURIComponent(message)}`);
  }

  const { month, year } = parsed.data;

  const association = await getAdminAssociation(session.id);

  if (!association) {
    redirect(
      `/admin/intretinere?error=${encodeURIComponent(
        "Nu există nicio asociație administrată de acest cont.",
      )}`,
    );
  }

  /*
   * Prima încercare de calcul creează lista în DRAFT.
   * Dacă preflight-ul eșuează, lista rămâne DRAFT.
   */
  const maintenanceList = await prisma.maintenanceList.upsert({
    where: {
      associationId_month_year: {
        associationId: association.id,
        month,
        year,
      },
    },
    update: {},
    create: {
      associationId: association.id,
      month,
      year,
      status: MaintenanceListStatus.DRAFT,
    },
  });

  if (
    maintenanceList.status === MaintenanceListStatus.PUBLISHED ||
    maintenanceList.status === MaintenanceListStatus.CLOSED
  ) {
    redirect(
      `/admin/intretinere?error=${encodeURIComponent(
        "Lista a fost deja publicată și nu mai poate fi recalculată.",
      )}`,
    );
  }

  const previousPeriod = getPreviousPeriod(month, year);

  const apartments = await prisma.apartment.findMany({
    where: {
      associationId: association.id,
    },
    include: {
      meters: {
        include: {
          readings: {
            where: {
              OR: [
                {
                  month,
                  year,
                },
                {
                  month: previousPeriod.month,
                  year: previousPeriod.year,
                },
              ],
            },
          },
        },
      },
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

  if (apartments.length === 0) {
    redirect(
      `/admin/intretinere?error=${encodeURIComponent(
        "Nu există apartamente în asociație.",
      )}`,
    );
  }

  const expenses = await prisma.expense.findMany({
    where: {
      associationId: association.id,
      month,
      year,
    },
  });

  if (expenses.length === 0) {
    redirect(
      `/admin/intretinere?error=${encodeURIComponent(
        "Nu există cheltuieli introduse pentru luna selectată.",
      )}`,
    );
  }

  const validationIssues = validateMaintenanceGeneration({
    apartments,
    expenses,
    month,
    year,
  });

  if (validationIssues.length > 0) {
    const validationMessage =
      formatMaintenanceValidationIssues(validationIssues);

    redirect(
      `/admin/intretinere?error=${encodeURIComponent(validationMessage)}`,
    );
  }

  let calculationError: string | null = null;

  let invoiceData: ReturnType<typeof calculateMaintenance> | null = null;

  try {
    invoiceData = calculateMaintenance({
      apartments,
      expenses,
      month,
      year,
    });
  } catch (error) {
    if (error instanceof MaintenanceCalculationError) {
      calculationError = error.message;
    } else {
      throw error;
    }
  }

  if (calculationError) {
    redirect(
      `/admin/intretinere?error=${encodeURIComponent(calculationError)}`,
    );
  }

  if (!invoiceData) {
    throw new Error("Motorul de calcul nu a returnat rezultatul întreținerii.");
  }

  /*
   * În mod normal o listă CALCULATED nu poate avea plăți,
   * deoarece locatarul încă nu o vede.
   * Verificarea protejează însă recalcularea.
   */
  const existingPaymentCount = await prisma.payment.count({
    where: {
      invoice: {
        maintenanceListId: maintenanceList.id,
      },
    },
  });

  if (existingPaymentCount > 0) {
    redirect(
      `/admin/intretinere?error=${encodeURIComponent(
        "Lista are deja plăți asociate și nu poate fi recalculată.",
      )}`,
    );
  }

  await prisma.$transaction(async (tx) => {
    const existingInvoices = await tx.invoice.findMany({
      where: {
        maintenanceListId: maintenanceList.id,
      },
      select: {
        id: true,
      },
    });

    const existingInvoiceIds = existingInvoices.map((invoice) => invoice.id);

    if (existingInvoiceIds.length > 0) {
      await tx.invoiceItem.deleteMany({
        where: {
          invoiceId: {
            in: existingInvoiceIds,
          },
        },
      });

      await tx.invoice.deleteMany({
        where: {
          id: {
            in: existingInvoiceIds,
          },
        },
      });
    }

    for (const invoice of invoiceData) {
      await tx.invoice.create({
        data: {
          maintenanceListId: maintenanceList.id,
          apartmentId: invoice.apartmentId,
          month,
          year,
          totalAmount: toMoneyString(invoice.totalAmount),

          items: {
            create: invoice.items.map((item) => ({
              description: item.description,

              amount: toMoneyString(item.amount),

              sourceType: item.sourceType,

              sourceId: item.sourceId,

              expenseCategory: item.expenseCategory,

              distributionMethod: item.distributionMethod,

              sourceAmount: toMoneyString(item.sourceAmount),

              basisValue: item.basisValue.toFixed(3),

              basisTotal: item.basisTotal.toFixed(3),

              basisUnit: item.basisUnit,

              sharePercentage: item.sharePercentage.toFixed(6),
            })),
          },
        },
      });
    }

    await tx.maintenanceList.update({
      where: {
        id: maintenanceList.id,
      },
      data: {
        status: MaintenanceListStatus.CALCULATED,
        calculatedAt: new Date(),
      },
    });
  });

  redirect(
    `/admin/intretinere?success=${encodeURIComponent(
      "Lista de întreținere a fost calculată cu succes. Verifică sumele înainte de publicare.",
    )}`,
  );
}

export async function publishMaintenanceListAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.ADMIN) {
    redirect("/locatar/dashboard");
  }

  const parsed = maintenanceListSchema.safeParse({
    maintenanceListId: formData.get("maintenanceListId"),
  });

  if (!parsed.success) {
    redirect(
      `/admin/intretinere?error=${encodeURIComponent(
        "Lista de întreținere este invalidă.",
      )}`,
    );
  }

  const maintenanceList = await prisma.maintenanceList.findFirst({
    where: {
      id: parsed.data.maintenanceListId,
      association: {
        adminId: session.id,
      },
    },
    include: {
      _count: {
        select: {
          invoices: true,
        },
      },
    },
  });

  if (!maintenanceList) {
    redirect(
      `/admin/intretinere?error=${encodeURIComponent(
        "Lista de întreținere nu există.",
      )}`,
    );
  }

  if (maintenanceList.status === MaintenanceListStatus.DRAFT) {
    redirect(
      `/admin/intretinere?error=${encodeURIComponent(
        "Lista trebuie calculată înainte de publicare.",
      )}`,
    );
  }

  if (maintenanceList.status === MaintenanceListStatus.CLOSED) {
    redirect(
      `/admin/intretinere?error=${encodeURIComponent(
        "Lista este deja închisă.",
      )}`,
    );
  }

  if (maintenanceList.status === MaintenanceListStatus.PUBLISHED) {
    redirect(
      `/admin/intretinere?success=${encodeURIComponent(
        "Lista este deja publicată.",
      )}`,
    );
  }

  if (maintenanceList._count.invoices === 0) {
    redirect(
      `/admin/intretinere?error=${encodeURIComponent(
        "Lista nu conține facturi și nu poate fi publicată.",
      )}`,
    );
  }

  await prisma.maintenanceList.update({
    where: {
      id: maintenanceList.id,
    },
    data: {
      status: MaintenanceListStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  redirect(
    `/admin/intretinere?success=${encodeURIComponent(
      "Lista de întreținere a fost publicată. Locatarii o pot vedea acum.",
    )}`,
  );
}

export async function closeMaintenanceListAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.ADMIN) {
    redirect("/locatar/dashboard");
  }

  const parsed = maintenanceListSchema.safeParse({
    maintenanceListId: formData.get("maintenanceListId"),
  });

  if (!parsed.success) {
    redirect(
      `/admin/intretinere?error=${encodeURIComponent(
        "Lista de întreținere este invalidă.",
      )}`,
    );
  }

  const maintenanceList = await prisma.maintenanceList.findFirst({
    where: {
      id: parsed.data.maintenanceListId,
      association: {
        adminId: session.id,
      },
    },
  });

  if (!maintenanceList) {
    redirect(
      `/admin/intretinere?error=${encodeURIComponent(
        "Lista de întreținere nu există.",
      )}`,
    );
  }

  if (maintenanceList.status === MaintenanceListStatus.CLOSED) {
    redirect(
      `/admin/intretinere?success=${encodeURIComponent(
        "Lista este deja închisă.",
      )}`,
    );
  }

  if (maintenanceList.status !== MaintenanceListStatus.PUBLISHED) {
    redirect(
      `/admin/intretinere?error=${encodeURIComponent(
        "Doar o listă publicată poate fi închisă.",
      )}`,
    );
  }

  await prisma.maintenanceList.update({
    where: {
      id: maintenanceList.id,
    },
    data: {
      status: MaintenanceListStatus.CLOSED,
      closedAt: new Date(),
    },
  });

  redirect(
    `/admin/intretinere?success=${encodeURIComponent(
      "Lista de întreținere a fost închisă.",
    )}`,
  );
}
