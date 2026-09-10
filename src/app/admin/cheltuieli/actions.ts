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

const excludedCategoryLabels = new Set([
  "lift",
  "administrare",
  "fond rulment",
  "fond de rulment",
]);

function normalizeLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function isExcludedCategory(category: ExpenseCategory) {
  return excludedCategoryLabels.has(
    normalizeLabel(EXPENSE_CATEGORY_LABELS[category]),
  );
}

const totalAmountSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string" || value.trim() === "") {
      return undefined;
    }

    return value.trim().replace(",", ".");
  },
  z.coerce
    .number()
    .positive("Suma trebuie să fie pozitivă")
    .refine(
      (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-9,
      "Suma poate avea maximum 2 zecimale",
    ),
);

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

  description: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    z.string().max(255, "Descrierea este prea lungă"),
  ),

  totalAmount: totalAmountSchema,

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

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const isFuturePeriod =
    parsed.data.year > currentYear ||
    (parsed.data.year === currentYear && parsed.data.month > currentMonth);

  if (isFuturePeriod) {
    redirect(
      `/admin/cheltuieli?error=${encodeURIComponent(
        "Cheltuielile nu pot fi introduse pentru perioade viitoare.",
      )}`,
    );
  }

  if (isExcludedCategory(parsed.data.category)) {
    redirect(
      `/admin/cheltuieli?error=${encodeURIComponent(
        "Categoria selectată nu este disponibilă pentru cheltuieli noi.",
      )}`,
    );
  }

  if (parsed.data.distributionMethod === ExpenseDistributionMethod.CUSTOM) {
    redirect(
      `/admin/cheltuieli?error=${encodeURIComponent(
        'Metoda de împărțire "Custom" nu este disponibilă.',
      )}`,
    );
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
