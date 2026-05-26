"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { ExpenseDistributionMethod, UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const generateInvoicesSchema = z.object({
  month: z.coerce
    .number()
    .int("Luna trebuie sa fie numar intreg")
    .min(1, "Luna trebuie sa fie intre 1 si 12")
    .max(12, "Luna trebuie sa fie intre 1 si 12"),

  year: z.coerce
    .number()
    .int("Anul trebuie sa fie numar intreg")
    .min(2024, "Anul este prea mic")
    .max(2100, "Anul este prea mare"),
});

type ConsumptionField =
  | "coldWater"
  | "hotWater"
  | "gas"
  | "electricity"
  | "heating";

function getConsumptionField(expenseType: string): ConsumptionField | null {
  const normalized = expenseType.trim().toLowerCase();

  if (normalized === "apa rece") {
    return "coldWater";
  }

  if (normalized === "apa calda") {
    return "hotWater";
  }

  if (normalized === "gaze") {
    return "gas";
  }

  if (normalized === "electricitate") {
    return "electricity";
  }

  if (normalized === "caldura") {
    return "heating";
  }

  return null;
}

function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100;
}

function toMoneyString(value: number) {
  return roundToTwoDecimals(value).toFixed(2);
}

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
        "Nu exista nicio asociatie administrata de acest cont.",
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
  });

  if (existingInvoices.length > 0) {
    redirect(
      `/admin/intretinere?error=${encodeURIComponent(
        "Intretinerea pentru aceasta luna a fost deja generata.",
      )}`,
    );
  }

  const apartments = await prisma.apartment.findMany({
    where: {
      associationId: association.id,
    },
    include: {
      consumptions: {
        where: {
          month,
          year,
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
        "Nu exista apartamente in asociatie.",
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
        "Nu exista cheltuieli introduse pentru luna selectata.",
      )}`,
    );
  }

  const invoiceData = apartments.map((apartment) => ({
    apartmentId: apartment.id,
    totalAmount: 0,
    items: [] as {
      description: string;
      amount: number;
      sourceType: string;
      sourceId: string;
    }[],
  }));

  for (const expense of expenses) {
    const totalAmount = Number(expense.totalAmount.toString());

    if (
      expense.distributionMethod === ExpenseDistributionMethod.PER_APARTMENT
    ) {
      let alreadyAllocated = 0;

      apartments.forEach((apartment, index) => {
        const isLast = index === apartments.length - 1;

        const amount = isLast
          ? roundToTwoDecimals(totalAmount - alreadyAllocated)
          : roundToTwoDecimals(totalAmount / apartments.length);

        alreadyAllocated += amount;

        const targetInvoice = invoiceData.find(
          (invoice) => invoice.apartmentId === apartment.id,
        );

        if (!targetInvoice) {
          return;
        }

        targetInvoice.totalAmount += amount;
        targetInvoice.items.push({
          description: expense.description,
          amount,
          sourceType: "EXPENSE",
          sourceId: expense.id,
        });
      });
    }

    if (expense.distributionMethod === ExpenseDistributionMethod.CUSTOM) {
      let alreadyAllocated = 0;

      apartments.forEach((apartment, index) => {
        const isLast = index === apartments.length - 1;

        const amount = isLast
          ? roundToTwoDecimals(totalAmount - alreadyAllocated)
          : roundToTwoDecimals(totalAmount / apartments.length);

        alreadyAllocated += amount;

        const targetInvoice = invoiceData.find(
          (invoice) => invoice.apartmentId === apartment.id,
        );

        if (!targetInvoice) {
          return;
        }

        targetInvoice.totalAmount += amount;
        targetInvoice.items.push({
          description: `${expense.description} (custom)`,
          amount,
          sourceType: "EXPENSE",
          sourceId: expense.id,
        });
      });
    }

    if (expense.distributionMethod === ExpenseDistributionMethod.PER_PERSON) {
      const totalResidents = apartments.reduce(
        (sum, apartment) => sum + apartment.numberOfResidents,
        0,
      );

      if (totalResidents <= 0) {
        redirect(
          `/admin/intretinere?error=${encodeURIComponent(
            "Nu se poate imparti per persoana: numarul total de persoane este 0.",
          )}`,
        );
      }

      let alreadyAllocated = 0;

      apartments.forEach((apartment, index) => {
        const isLast = index === apartments.length - 1;

        const amount = isLast
          ? roundToTwoDecimals(totalAmount - alreadyAllocated)
          : roundToTwoDecimals(
              (totalAmount * apartment.numberOfResidents) / totalResidents,
            );

        alreadyAllocated += amount;

        const targetInvoice = invoiceData.find(
          (invoice) => invoice.apartmentId === apartment.id,
        );

        if (!targetInvoice) {
          return;
        }

        targetInvoice.totalAmount += amount;
        targetInvoice.items.push({
          description: expense.description,
          amount,
          sourceType: "EXPENSE",
          sourceId: expense.id,
        });
      });
    }

    if (expense.distributionMethod === ExpenseDistributionMethod.BY_SURFACE) {
      const totalSurface = apartments.reduce(
        (sum, apartment) => sum + apartment.surface,
        0,
      );

      if (totalSurface <= 0) {
        redirect(
          `/admin/intretinere?error=${encodeURIComponent(
            "Nu se poate imparti dupa suprafata: suprafata totala este 0.",
          )}`,
        );
      }

      let alreadyAllocated = 0;

      apartments.forEach((apartment, index) => {
        const isLast = index === apartments.length - 1;

        const amount = isLast
          ? roundToTwoDecimals(totalAmount - alreadyAllocated)
          : roundToTwoDecimals(
              (totalAmount * apartment.surface) / totalSurface,
            );

        alreadyAllocated += amount;

        const targetInvoice = invoiceData.find(
          (invoice) => invoice.apartmentId === apartment.id,
        );

        if (!targetInvoice) {
          return;
        }

        targetInvoice.totalAmount += amount;
        targetInvoice.items.push({
          description: expense.description,
          amount,
          sourceType: "EXPENSE",
          sourceId: expense.id,
        });
      });
    }

    if (
      expense.distributionMethod === ExpenseDistributionMethod.BY_CONSUMPTION
    ) {
      const consumptionField = getConsumptionField(expense.type);

      if (!consumptionField) {
        redirect(
          `/admin/intretinere?error=${encodeURIComponent(
            `Cheltuiala "${expense.type}" nu poate fi impartita dupa consum.`,
          )}`,
        );
      }

      const totalConsumption = apartments.reduce((sum, apartment) => {
        const consumption = apartment.consumptions[0];
        return sum + (consumption ? consumption[consumptionField] : 0);
      }, 0);

      if (totalConsumption <= 0) {
        redirect(
          `/admin/intretinere?error=${encodeURIComponent(
            `Nu se poate calcula "${expense.type}": consumul total este 0.`,
          )}`,
        );
      }

      let alreadyAllocated = 0;

      apartments.forEach((apartment, index) => {
        const consumption = apartment.consumptions[0];
        const apartmentConsumption = consumption
          ? consumption[consumptionField]
          : 0;

        const isLast = index === apartments.length - 1;

        const amount = isLast
          ? roundToTwoDecimals(totalAmount - alreadyAllocated)
          : roundToTwoDecimals(
              (totalAmount * apartmentConsumption) / totalConsumption,
            );

        alreadyAllocated += amount;

        const targetInvoice = invoiceData.find(
          (invoice) => invoice.apartmentId === apartment.id,
        );

        if (!targetInvoice) {
          return;
        }

        targetInvoice.totalAmount += amount;
        targetInvoice.items.push({
          description: expense.description,
          amount,
          sourceType: "EXPENSE",
          sourceId: expense.id,
        });
      });
    }
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
      "Intretinerea a fost generata cu succes.",
    )}`,
  );
}
