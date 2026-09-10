"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const createAnnouncementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Titlul trebuie să aibă cel puțin 3 caractere")
    .max(100, "Titlul este prea lung"),

  content: z
    .string()
    .trim()
    .min(10, "Conținutul trebuie să aibă cel puțin 10 caractere")
    .max(2000, "Conținutul este prea lung"),
});

const editAnnouncementSchema = z.object({
  announcementId: z.string().min(1, "Anunț invalid"),

  title: z
    .string()
    .trim()
    .min(3, "Titlul trebuie să aibă cel puțin 3 caractere")
    .max(100, "Titlul este prea lung"),

  content: z
    .string()
    .trim()
    .min(10, "Conținutul trebuie să aibă cel puțin 10 caractere")
    .max(2000, "Conținutul este prea lung"),
});

const withdrawAnnouncementSchema = z.object({
  announcementId: z.string().min(1, "Anunț invalid"),
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
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Date invalide",
    };
  }

  const association = await prisma.association.findFirst({
    where: {
      adminId: session.id,
    },

    select: {
      id: true,
    },
  });

  if (!association) {
    return {
      success: false,
      message: "Nu există nicio asociație administrată de acest cont.",
    };
  }

  await prisma.announcement.create({
    data: {
      associationId: association.id,
      title: parsed.data.title,
      content: parsed.data.content,
    },
  });

  revalidatePath("/admin/avizier");
  revalidatePath("/locatar/avizier");

  return {
    success: true,
    message: "Anunțul a fost publicat cu succes.",
  };
}

export async function editAnnouncementAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.ADMIN) {
    redirect("/locatar/dashboard");
  }

  const parsed = editAnnouncementSchema.safeParse({
    announcementId: formData.get("announcementId"),
    title: formData.get("title"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Date invalide",
    };
  }

  const announcement = await prisma.announcement.findFirst({
    where: {
      id: parsed.data.announcementId,

      association: {
        adminId: session.id,
      },
    },

    select: {
      id: true,
      withdrawnAt: true,
    },
  });

  if (!announcement) {
    return {
      success: false,
      message:
        "Anunțul nu există sau nu aparține unei asociații administrate de acest cont.",
    };
  }

  if (announcement.withdrawnAt) {
    return {
      success: false,
      message: "Un anunț retras nu mai poate fi modificat.",
    };
  }

  await prisma.announcement.update({
    where: {
      id: announcement.id,
    },

    data: {
      title: parsed.data.title,
      content: parsed.data.content,
    },
  });

  revalidatePath("/admin/avizier");
  revalidatePath("/locatar/avizier");

  return {
    success: true,
    message: "Anunțul a fost actualizat cu succes.",
  };
}

export async function withdrawAnnouncementAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.ADMIN) {
    redirect("/locatar/dashboard");
  }

  const parsed = withdrawAnnouncementSchema.safeParse({
    announcementId: formData.get("announcementId"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Date invalide",
    };
  }

  const announcement = await prisma.announcement.findFirst({
    where: {
      id: parsed.data.announcementId,

      association: {
        adminId: session.id,
      },
    },

    select: {
      id: true,
      withdrawnAt: true,
    },
  });

  if (!announcement) {
    return {
      success: false,
      message:
        "Anunțul nu există sau nu aparține unei asociații administrate de acest cont.",
    };
  }

  if (announcement.withdrawnAt) {
    return {
      success: false,
      message: "Anunțul este deja retras.",
    };
  }

  await prisma.announcement.update({
    where: {
      id: announcement.id,
    },

    data: {
      withdrawnAt: new Date(),
    },
  });

  revalidatePath("/admin/avizier");
  revalidatePath("/locatar/avizier");

  return {
    success: true,
    message: "Anunțul a fost retras cu succes.",
  };
}
