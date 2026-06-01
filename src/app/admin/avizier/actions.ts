"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const createAnnouncementSchema = z.object({
  title: z
    .string()
    .min(3, "Titlul trebuie sa aiba cel putin 3 caractere")
    .max(100, "Titlul este prea lung"),

  content: z
    .string()
    .min(10, "Continutul trebuie sa aiba cel putin 10 caractere")
    .max(2000, "Continutul este prea lung"),
});

export async function createAnnouncementAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.ADMIN) {
    redirect("/locatar/dashboard");
  }

  const parsed = createAnnouncementSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Date invalide";
    redirect(`/admin/avizier?error=${encodeURIComponent(message)}`);
  }

  const association = await prisma.association.findFirst({
    where: {
      adminId: session.id,
    },
  });

  if (!association) {
    redirect(
      `/admin/avizier?error=${encodeURIComponent(
        "Nu exista nicio asociatie administrata de acest cont.",
      )}`,
    );
  }

  await prisma.announcement.create({
    data: {
      associationId: association.id,
      title: parsed.data.title,
      content: parsed.data.content,
    },
  });

  redirect(
    `/admin/avizier?success=${encodeURIComponent(
      "Anuntul a fost publicat cu succes.",
    )}`,
  );
}
