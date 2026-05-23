"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const createApartmentSchema = z.object({
  tenantName: z.string().min(2, "Numele trebuie sa aiba cel putin 2 caractere"),
  tenantEmail: z.email("Email invalid"),
  apartmentNumber: z.string().min(1, "Numarul apartamentului este obligatoriu"),
  floor: z.coerce.number().int("Etajul trebuie sa fie numar intreg"),
  surface: z.coerce.number().positive("Suprafata trebuie sa fie pozitiva"),
  numberOfResidents: z.coerce
    .number()
    .int("Numarul de persoane trebuie sa fie numar intreg")
    .min(1, "Trebuie sa existe cel putin o persoana"),
});

export async function createApartmentAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.ADMIN) {
    redirect("/locatar/dashboard");
  }

  const parsed = createApartmentSchema.safeParse({
    tenantName: formData.get("tenantName"),
    tenantEmail: formData.get("tenantEmail"),
    apartmentNumber: formData.get("apartmentNumber"),
    floor: formData.get("floor"),
    surface: formData.get("surface"),
    numberOfResidents: formData.get("numberOfResidents"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Date invalide";
    redirect(`/admin/apartamente/new?error=${encodeURIComponent(message)}`);
  }

  const {
    tenantName,
    tenantEmail,
    apartmentNumber,
    floor,
    surface,
    numberOfResidents,
  } = parsed.data;

  const association = await prisma.association.findFirst({
    where: {
      adminId: session.id,
    },
  });

  if (!association) {
    redirect(
      `/admin/apartamente/new?error=${encodeURIComponent(
        "Nu exista nicio asociatie administrata de acest cont.",
      )}`,
    );
  }

  const existingApartment = await prisma.apartment.findFirst({
    where: {
      associationId: association.id,
      number: apartmentNumber,
    },
  });

  if (existingApartment) {
    redirect(
      `/admin/apartamente/new?error=${encodeURIComponent(
        "Exista deja un apartament cu acest numar in asociatie.",
      )}`,
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: tenantEmail,
    },
  });

  if (existingUser) {
    redirect(
      `/admin/apartamente/new?error=${encodeURIComponent(
        "Exista deja un utilizator cu acest email.",
      )}`,
    );
  }

  const defaultPassword = "locatar123";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  await prisma.$transaction(async (tx) => {
    const tenant = await tx.user.create({
      data: {
        name: tenantName,
        email: tenantEmail,
        passwordHash,
        role: UserRole.TENANT,
      },
    });

    await tx.apartment.create({
      data: {
        associationId: association.id,
        ownerId: tenant.id,
        number: apartmentNumber,
        floor,
        surface,
        numberOfResidents,
      },
    });
  });

  redirect("/admin/apartamente");
}
