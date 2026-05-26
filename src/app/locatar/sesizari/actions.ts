"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const createTicketSchema = z.object({
  title: z
    .string()
    .min(3, "Titlul trebuie sa aiba cel putin 3 caractere")
    .max(100, "Titlul este prea lung"),

  description: z
    .string()
    .min(10, "Descrierea trebuie sa aiba cel putin 10 caractere")
    .max(1000, "Descrierea este prea lunga"),
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
  });

  if (!apartment) {
    redirect(
      `/locatar/sesizari?error=${encodeURIComponent(
        "Nu exista niciun apartament asociat acestui cont.",
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
      "Sesizarea a fost trimisa cu succes.",
    )}`,
  );
}
