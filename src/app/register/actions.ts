"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Numele trebuie să aibă cel puțin 2 caractere")
    .max(100, "Numele este prea lung"),

  email: z
    .email("Email invalid")
    .transform((email) => email.trim().toLowerCase()),

  password: z
    .string()
    .min(8, "Parola trebuie să aibă cel puțin 8 caractere")
    .max(72, "Parola este prea lungă"),

  associationName: z
    .string()
    .trim()
    .min(3, "Denumirea asociației trebuie să aibă cel puțin 3 caractere")
    .max(150, "Denumirea asociației este prea lungă"),
});

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    associationName: formData.get("associationName"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Date invalide";

    redirect(`/register?error=${encodeURIComponent(message)}`);
  }

  const { name, email, password, associationName } = parsed.data;

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    redirect(
      `/register?error=${encodeURIComponent(
        "Există deja un cont cu această adresă de email.",
      )}`,
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    const admin = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: UserRole.ADMIN,
      },
    });

    await tx.association.create({
      data: {
        name: associationName,
        adminId: admin.id,
      },
    });
  });

  redirect(
    `/login?success=${encodeURIComponent(
      "Contul a fost creat cu succes. Te poți autentifica.",
    )}`,
  );
}
