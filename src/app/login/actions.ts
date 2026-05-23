"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { UserRole } from "@/generated/prisma/client";

const loginSchema = z.object({
  email: z.email("Email invalid"),
  password: z.string().min(1, "Parola este obligatorie"),
});

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/login?error=Date invalide");
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    redirect("/login?error=Email sau parola gresita");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    redirect("/login?error=Email sau parola gresita");
  }

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  if (user.role === UserRole.ADMIN) {
    redirect("/admin/dashboard");
  }

  redirect("/locatar/dashboard");
}
