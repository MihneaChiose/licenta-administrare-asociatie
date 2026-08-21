"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { METER_UTILITY_CONFIG } from "@/lib/meters";

const readingValueSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string" || value.trim() === "") {
      return undefined;
    }

    return value.trim().replace(",", ".");
  },
  z.coerce.number().min(0, "Indexul nu poate fi negativ"),
);

const meterReadingsSchema = z.object({
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

  coldWater: readingValueSchema,
  hotWater: readingValueSchema,
  gas: readingValueSchema,
  electricity: readingValueSchema,
  heating: readingValueSchema,
});

export async function submitMeterReadingsAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.TENANT) {
    redirect("/admin/dashboard");
  }

  const parsed = meterReadingsSchema.safeParse({
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
    include: {
      meters: {
        select: {
          id: true,
          utilityType: true,
        },
      },
    },
  });

  if (!apartment) {
    redirect(
      `/locatar/consum?error=${encodeURIComponent(
        "Nu există niciun apartament asociat acestui cont.",
      )}`,
    );
  }

  const meterByUtilityType = new Map(
    apartment.meters.map((meter) => [meter.utilityType, meter]),
  );

  const missingMeters = METER_UTILITY_CONFIG.filter(
    (utility) => !meterByUtilityType.has(utility.utilityType),
  );

  if (missingMeters.length > 0) {
    const missingLabels = missingMeters
      .map((utility) => utility.label)
      .join(", ");

    redirect(
      `/locatar/consum?error=${encodeURIComponent(
        `Apartamentul nu are toate contoarele configurate. Lipsesc: ${missingLabels}.`,
      )}`,
    );
  }

  const existingReadings = await prisma.meterReading.count({
    where: {
      month: parsed.data.month,
      year: parsed.data.year,
      meter: {
        apartmentId: apartment.id,
      },
    },
  });

  if (existingReadings > 0) {
    redirect(
      `/locatar/consum?error=${encodeURIComponent(
        "Indexurile pentru această lună au fost deja transmise.",
      )}`,
    );
  }

  const readingsToCreate = METER_UTILITY_CONFIG.map((utility) => {
    const meter = meterByUtilityType.get(utility.utilityType);

    if (!meter) {
      throw new Error(
        `Contorul ${utility.utilityType} nu a fost găsit pentru apartament.`,
      );
    }

    return {
      meterId: meter.id,
      month: parsed.data.month,
      year: parsed.data.year,
      readingValue: parsed.data[utility.fieldName].toFixed(3),
    };
  });

  await prisma.meterReading.createMany({
    data: readingsToCreate,
  });

  redirect(
    `/locatar/consum?success=${encodeURIComponent(
      "Indexurile au fost transmise cu succes.",
    )}`,
  );
}
