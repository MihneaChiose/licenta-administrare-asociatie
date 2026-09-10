"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  getNextPeriod,
  getPreviousPeriod,
  TENANT_METER_UTILITY_CONFIG,
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
    .int("Luna trebuie sÄƒ fie numÄƒr Ã®ntreg")
    .min(1, "Luna trebuie sÄƒ fie Ã®ntre 1 È™i 12")
    .max(12, "Luna trebuie sÄƒ fie Ã®ntre 1 È™i 12"),

  year: z.coerce
    .number()
    .int("Anul trebuie sÄƒ fie numÄƒr Ã®ntreg")
    .min(2024, "Anul este prea mic")
    .max(2100, "Anul este prea mare"),

  utilityType: z.string().min(1, "Utilitatea este obligatorie"),

  readingValue: readingValueSchema,
});

function hasMaximumDecimals(value: number, decimals: number) {
  const factor = 10 ** decimals;

  return Math.abs(value * factor - Math.round(value * factor)) < 1e-9;
}

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

    redirect(`/locatar/contoare?error=${encodeURIComponent(message)}`);
  }

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const isFuturePeriod =
    parsed.data.year > currentYear ||
    (parsed.data.year === currentYear && parsed.data.month > currentMonth);

  if (isFuturePeriod) {
    redirect(
      `/locatar/contoare?error=${encodeURIComponent(
        "Indexurile nu pot fi transmise pentru perioade viitoare.",
      )}`,
    );
  }

  const utility = TENANT_METER_UTILITY_CONFIG.find(
    (config) => config.utilityType === parsed.data.utilityType,
  );

  if (!utility) {
    redirect(
      `/locatar/contoare?error=${encodeURIComponent(
        "Utilitatea selectatÄƒ nu este validÄƒ.",
      )}`,
    );
  }

  if (!hasMaximumDecimals(parsed.data.readingValue, utility.decimals)) {
    redirect(
      `/locatar/contoare?error=${encodeURIComponent(
        `${utility.label}: indexul poate avea maximum ${utility.decimals} zecimale.`,
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
      `/locatar/contoare?error=${encodeURIComponent(
        "Nu existÄƒ niciun apartament asociat acestui cont.",
      )}`,
    );
  }

  const meter = apartment.meters.find(
    (apartmentMeter) => apartmentMeter.utilityType === utility.utilityType,
  );

  if (!meter) {
    redirect(
      `/locatar/contoare?error=${encodeURIComponent(
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
      `/locatar/contoare?error=${encodeURIComponent(
        `Indexul pentru ${utility.label} a fost deja transmis pentru perioada selectatÄƒ.`,
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
        `/locatar/contoare?error=${encodeURIComponent(
          `${utility.label}: indexul curent (${currentValue}) nu poate fi mai mic decÃ¢t indexul lunii precedente (${previousValue}).`,
        )}`,
      );
    }
  }

  if (nextReading) {
    const nextValue = Number(nextReading.readingValue.toString());

    if (currentValue > nextValue) {
      redirect(
        `/locatar/contoare?error=${encodeURIComponent(
          `${utility.label}: indexul introdus (${currentValue}) nu poate fi mai mare decÃ¢t indexul lunii urmÄƒtoare deja transmis (${nextValue}).`,
        )}`,
      );
    }
  }

  await prisma.meterReading.create({
    data: {
      meterId: meter.id,
      month: parsed.data.month,
      year: parsed.data.year,
      readingValue: currentValue.toFixed(utility.decimals),
    },
  });

  redirect(
    `/locatar/contoare?success=${encodeURIComponent(
      `Indexul pentru ${utility.label} a fost transmis cu succes.`,
    )}`,
  );
}

