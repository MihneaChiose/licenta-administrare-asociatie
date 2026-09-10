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

const meterReadingSchema = z.object({
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

  utilityType: z.string().min(1, "Utilitatea este obligatorie"),

  readingValue: readingValueSchema,
});

export async function submitMeterReadingAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.TENANT) {
    redirect("/admin/dashboard");
  }

  const parsed = meterReadingSchema.safeParse({
    month: formData.get("month"),
    year: formData.get("year"),
    utilityType: formData.get("utilityType"),
    readingValue: formData.get("readingValue"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Date invalide";

    redirect(`/locatar/consum?error=${encodeURIComponent(message)}`);
  }

  const utility = METER_UTILITY_CONFIG.find(
    (config) => config.utilityType === parsed.data.utilityType,
  );

  if (!utility) {
    redirect(
      `/locatar/consum?error=${encodeURIComponent(
        "Utilitatea selectată nu este validă.",
      )}`,
    );
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

  const meter = apartment.meters.find(
    (apartmentMeter) => apartmentMeter.utilityType === utility.utilityType,
  );

  if (!meter) {
    redirect(
      `/locatar/consum?error=${encodeURIComponent(
        `Contorul pentru ${utility.label} nu este configurat pentru acest apartament.`,
      )}`,
    );
  }

  const existingReading = await prisma.meterReading.findFirst({
    where: {
      meterId: meter.id,
      month: parsed.data.month,
      year: parsed.data.year,
    },

    select: {
      id: true,
    },
  });

  if (existingReading) {
    redirect(
      `/locatar/consum?error=${encodeURIComponent(
        `Indexul pentru ${utility.label} a fost deja transmis pentru perioada selectată.`,
      )}`,
    );
  }

  const previousPeriod = getPreviousPeriod(parsed.data.month, parsed.data.year);

  const nextPeriod = getNextPeriod(parsed.data.month, parsed.data.year);

  const [previousReading, nextReading] = await Promise.all([
    prisma.meterReading.findFirst({
      where: {
        meterId: meter.id,
        month: previousPeriod.month,
        year: previousPeriod.year,
      },

      select: {
        readingValue: true,
      },
    }),

    prisma.meterReading.findFirst({
      where: {
        meterId: meter.id,
        month: nextPeriod.month,
        year: nextPeriod.year,
      },

      select: {
        readingValue: true,
      },
    }),
  ]);

  const currentValue = parsed.data.readingValue;

  if (previousReading) {
    const previousValue = Number(previousReading.readingValue.toString());

    if (currentValue < previousValue) {
      redirect(
        `/locatar/consum?error=${encodeURIComponent(
          `${utility.label}: indexul curent (${currentValue}) nu poate fi mai mic decât indexul lunii precedente (${previousValue}).`,
        )}`,
      );
    }
  }

  if (nextReading) {
    const nextValue = Number(nextReading.readingValue.toString());

    if (currentValue > nextValue) {
      redirect(
        `/locatar/consum?error=${encodeURIComponent(
          `${utility.label}: indexul introdus (${currentValue}) nu poate fi mai mare decât indexul lunii următoare deja transmis (${nextValue}).`,
        )}`,
      );
    }
  }

  await prisma.meterReading.create({
    data: {
      meterId: meter.id,
      month: parsed.data.month,
      year: parsed.data.year,
      readingValue: currentValue.toFixed(3),
    },
  });

  redirect(
    `/locatar/consum?success=${encodeURIComponent(
      `Indexul pentru ${utility.label} a fost transmis cu succes.`,
    )}`,
  );
}
