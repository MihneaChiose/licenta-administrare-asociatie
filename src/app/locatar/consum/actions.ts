"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const consumptionSchema = z.object({
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

  coldWater: z.coerce.number().min(0, "Apa rece nu poate fi negativa"),

  hotWater: z.coerce.number().min(0, "Apa calda nu poate fi negativa"),

  gas: z.coerce.number().min(0, "Gazele nu pot fi negative"),

  electricity: z.coerce.number().min(0, "Electricitatea nu poate fi negativa"),

  heating: z.coerce.number().min(0, "Caldura nu poate fi negativa"),
});

export async function submitConsumptionAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.TENANT) {
    redirect("/admin/dashboard");
  }

  const parsed = consumptionSchema.safeParse({
    month: formData.get("month"),
    year: formData.get("year"),
    coldWater: formData.get("coldWater"),
    hotWater: formData.get("hotWater"),
    gas: formData.get("gas"),
    electricity: formData.get("electricity"),
    heating: formData.get("heating"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Date invalide";
    redirect(`/locatar/consum?error=${encodeURIComponent(message)}`);
  }

  const apartment = await prisma.apartment.findFirst({
    where: {
      ownerId: session.id,
    },
  });

  if (!apartment) {
    redirect(
      `/locatar/consum?error=${encodeURIComponent(
        "Nu exista niciun apartament asociat acestui cont.",
      )}`,
    );
  }

  const existingConsumption = await prisma.consumption.findUnique({
    where: {
      apartmentId_month_year: {
        apartmentId: apartment.id,
        month: parsed.data.month,
        year: parsed.data.year,
      },
    },
  });

  if (existingConsumption) {
    redirect(
      `/locatar/consum?error=${encodeURIComponent(
        "Consumul pentru aceasta luna a fost deja transmis.",
      )}`,
    );
  }

  await prisma.consumption.create({
    data: {
      apartmentId: apartment.id,
      month: parsed.data.month,
      year: parsed.data.year,
      coldWater: parsed.data.coldWater,
      hotWater: parsed.data.hotWater,
      gas: parsed.data.gas,
      electricity: parsed.data.electricity,
      heating: parsed.data.heating,
    },
  });

  redirect("/locatar/consum?success=Consumul a fost transmis cu succes");
}
