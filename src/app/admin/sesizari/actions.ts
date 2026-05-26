"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { TicketStatus, UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const updateTicketStatusSchema = z.object({
  ticketId: z.string().min(1, "Ticket invalid"),
  status: z.enum(TicketStatus),
});

export async function updateTicketStatusAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.ADMIN) {
    redirect("/locatar/dashboard");
  }

  const parsed = updateTicketStatusSchema.safeParse({
    ticketId: formData.get("ticketId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Date invalide";
    redirect(`/admin/sesizari?error=${encodeURIComponent(message)}`);
  }

  const ticket = await prisma.ticket.findFirst({
    where: {
      id: parsed.data.ticketId,
      apartment: {
        association: {
          adminId: session.id,
        },
      },
    },
  });

  if (!ticket) {
    redirect(
      `/admin/sesizari?error=${encodeURIComponent(
        "Sesizarea nu exista sau nu apartine asociatiei administrate.",
      )}`,
    );
  }

  await prisma.ticket.update({
    where: {
      id: parsed.data.ticketId,
    },
    data: {
      status: parsed.data.status,
    },
  });

  redirect(
    `/admin/sesizari?success=${encodeURIComponent(
      "Statusul sesizarii a fost actualizat.",
    )}`,
  );
}
