"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { ExpenseDistributionMethod, UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const expenseSchema = z.object({
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

  type: z.string().min(2, "Tipul cheltuielii este obligatoriu"),

  description: z
    .string()
    .min(2, "Descrierea este obligatorie")
    .max(255, "Descrierea este prea lunga"),

  totalAmount: z.coerce.number().positive("Suma trebuie sa fie pozitiva"),

  distributionMethod: z.nativeEnum(ExpenseDistributionMethod),
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
    type: formData.get("type"),
    description: formData.get("description"),
    totalAmount: formData.get("totalAmount"),
    distributionMethod: formData.get("distributionMethod"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Date invalide";
    redirect(`/admin/cheltuieli?error=${encodeURIComponent(message)}`);
  }

  const association = await prisma.association.findFirst({
    where: {
      adminId: session.id,
    },
  });

  if (!association) {
    redirect(
      `/admin/cheltuieli?error=${encodeURIComponent(
        "Nu exista nicio asociatie administrata de acest cont.",
      )}`,
    );
  }

  await prisma.expense.create({
    data: {
      associationId: association.id,
      month: parsed.data.month,
      year: parsed.data.year,
      type: parsed.data.type,
      description: parsed.data.description,
      totalAmount: parsed.data.totalAmount,
      distributionMethod: parsed.data.distributionMethod,
    },
  });

  redirect("/admin/cheltuieli?success=Cheltuiala a fost adaugata cu succes");
}
