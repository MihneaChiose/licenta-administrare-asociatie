"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getPreviousPeriod } from "@/lib/meters";
import { getSession } from "@/lib/session";
import { calculateMaintenance } from "@/services/maintenance/calculate-maintenance";
import { MaintenanceCalculationError } from "@/services/maintenance/errors";
import { toMoneyString } from "@/services/maintenance/utils";

const generateInvoicesSchema = z.object({
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

export async function generateInvoicesAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.ADMIN) {
    redirect("/locatar/dashboard");
  }

  const parsed = generateInvoicesSchema.safeParse({
    month: formData.get("month"),
    year: formData.get("year"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Date invalide";

    redirect(`/admin/intretinere?error=${encodeURIComponent(message)}`);
  }

  const { month, year } = parsed.data;

  const association = await prisma.association.findFirst({
    where: {
      adminId: session.id,
    },
  });

  if (!association) {
    redirect(
      `/admin/intretinere?error=${encodeURIComponent(
        "Nu există nicio asociație administrată de acest cont.",
      )}`,
    );
  }

  const existingInvoices = await prisma.invoice.findMany({
    where: {
      month,
      year,
      apartment: {
        associationId: association.id,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingInvoices.length > 0) {
    redirect(
      `/admin/intretinere?error=${encodeURIComponent(
        "Întreținerea pentru această lună a fost deja generată.",
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

  await prisma.$transaction(async (tx) => {
    for (const invoice of invoiceData) {
      await tx.invoice.create({
        data: {
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
            })),
          },
        },
      });
    }
  });

  redirect(
    `/admin/intretinere?success=${encodeURIComponent(
      "Întreținerea a fost generată cu succes.",
    )}`,
  );
}
