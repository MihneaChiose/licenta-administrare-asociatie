"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  getNextPeriod,
  getPreviousPeriod,
  METER_UTILITY_CONFIG,
} from "@/lib/meters";

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

  const previousPeriod = getPreviousPeriod(parsed.data.month, parsed.data.year);

  const nextPeriod = getNextPeriod(parsed.data.month, parsed.data.year);

  const meterIds = apartment.meters.map((meter) => meter.id);

  const [previousReadings, nextReadings] = await Promise.all([
    prisma.meterReading.findMany({
      where: {
        meterId: {
          in: meterIds,
        },
        month: previousPeriod.month,
        year: previousPeriod.year,
      },
      select: {
        meterId: true,
        readingValue: true,
      },
    }),

    prisma.meterReading.findMany({
      where: {
        meterId: {
          in: meterIds,
        },
        month: nextPeriod.month,
        year: nextPeriod.year,
      },
      select: {
        meterId: true,
        readingValue: true,
      },
    }),
  ]);

  const previousReadingByMeterId = new Map(
    previousReadings.map((reading) => [
      reading.meterId,
      Number(reading.readingValue.toString()),
    ]),
  );

  const nextReadingByMeterId = new Map(
    nextReadings.map((reading) => [
      reading.meterId,
      Number(reading.readingValue.toString()),
    ]),
  );

  for (const utility of METER_UTILITY_CONFIG) {
    const meter = meterByUtilityType.get(utility.utilityType);

    if (!meter) {
      continue;
    }

    const currentValue = parsed.data[utility.fieldName];

    const previousValue = previousReadingByMeterId.get(meter.id);

    if (previousValue !== undefined && currentValue < previousValue) {
      redirect(
        `/locatar/consum?error=${encodeURIComponent(
          `${utility.label}: indexul curent (${currentValue}) nu poate fi mai mic decât indexul lunii precedente (${previousValue}).`,
        )}`,
      );
    }

    const nextValue = nextReadingByMeterId.get(meter.id);

    if (nextValue !== undefined && currentValue > nextValue) {
      redirect(
        `/locatar/consum?error=${encodeURIComponent(
          `${utility.label}: indexul introdus (${currentValue}) nu poate fi mai mare decât indexul lunii următoare deja transmis (${nextValue}).`,
        )}`,
      );
    }
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
