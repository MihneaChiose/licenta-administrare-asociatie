"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const createTicketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Titlul trebuie să aibă cel puțin 3 caractere")
    .max(100, "Titlul este prea lung"),

  description: z
    .string()
    .trim()
    .min(10, "Descrierea trebuie să aibă cel puțin 10 caractere")
    .max(1000, "Descrierea este prea lungă"),
});

export async function createTicketAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.TENANT) {
    redirect("/admin/dashboard");
  }

  const parsed = createTicketSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Date invalide";

    redirect(`/locatar/sesizari?error=${encodeURIComponent(message)}`);
  }

  const apartment = await prisma.apartment.findFirst({
    where: {
      ownerId: session.id,
    },

    select: {
      id: true,
    },

    orderBy: {
      number: "asc",
    },
  });

  if (!apartment) {
    redirect(
      `/locatar/sesizari?error=${encodeURIComponent(
        "Nu există niciun apartament asociat contului tău.",
      )}`,
    );
  }

  await prisma.ticket.create({
    data: {
      apartmentId: apartment.id,
      title: parsed.data.title,
      description: parsed.data.description,
    },
  });

  redirect(
    `/locatar/sesizari?success=${encodeURIComponent(
      "Sesizarea a fost trimisă cu succes.",
    )}`,
  );
}
