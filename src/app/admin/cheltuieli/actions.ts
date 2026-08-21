"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  ExpenseCategory,
  ExpenseDistributionMethod,
  UserRole,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  EXPENSE_CATEGORY_LABELS,
  getUtilityTypeForExpenseCategory,
} from "@/lib/expenses";

const expenseSchema = z.object({
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

  category: z.enum(ExpenseCategory),

  description: z
    .string()
    .trim()
    .min(2, "Descrierea este obligatorie")
    .max(255, "Descrierea este prea lungă"),

  totalAmount: z.coerce.number().positive("Suma trebuie să fie pozitivă"),

  distributionMethod: z.enum(ExpenseDistributionMethod),
});

export async function createExpenseAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.ADMIN) {
    redirect("/locatar/dashboard");
  }

  const parsed = expenseSchema.safeParse({
    month: formData.get("month"),
    year: formData.get("year"),
    category: formData.get("category"),
    description: formData.get("description"),
    totalAmount: formData.get("totalAmount"),
    distributionMethod: formData.get("distributionMethod"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Date invalide";

    redirect(`/admin/cheltuieli?error=${encodeURIComponent(message)}`);
  }

  if (
    parsed.data.distributionMethod ===
      ExpenseDistributionMethod.BY_CONSUMPTION &&
    !getUtilityTypeForExpenseCategory(parsed.data.category)
  ) {
    const categoryLabel = EXPENSE_CATEGORY_LABELS[parsed.data.category];

    redirect(
      `/admin/cheltuieli?error=${encodeURIComponent(
        `Categoria "${categoryLabel}" nu poate fi repartizată după consumul contoarelor.`,
      )}`,
    );
  }

  const association = await prisma.association.findFirst({
    where: {
      adminId: session.id,
    },
  });

  if (!association) {
    redirect(
      `/admin/cheltuieli?error=${encodeURIComponent(
        "Nu există nicio asociație administrată de acest cont.",
      )}`,
    );
  }

  await prisma.expense.create({
    data: {
      associationId: association.id,
      month: parsed.data.month,
      year: parsed.data.year,
      category: parsed.data.category,
      description: parsed.data.description,
      totalAmount: parsed.data.totalAmount,
      distributionMethod: parsed.data.distributionMethod,
    },
  });

  redirect(
    `/admin/cheltuieli?success=${encodeURIComponent(
      "Cheltuiala a fost adăugată cu succes.",
    )}`,
  );
}
