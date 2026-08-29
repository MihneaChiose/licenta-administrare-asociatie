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

const nextTicketStatus: Partial<Record<TicketStatus, TicketStatus>> = {
  [TicketStatus.OPEN]: TicketStatus.IN_PROGRESS,
  [TicketStatus.IN_PROGRESS]: TicketStatus.RESOLVED,
  [TicketStatus.RESOLVED]: TicketStatus.CLOSED,
};

type TicketFilter = TicketStatus | "ALL";

function normalizeTicketFilter(value: FormDataEntryValue | null): TicketFilter {
  if (typeof value !== "string") {
    return "ALL";
  }

  if (Object.values(TicketStatus).includes(value as TicketStatus)) {
    return value as TicketStatus;
  }

  return "ALL";
}

function getAdminTicketsRedirectUrl(
  type: "error" | "success",
  message: string,
  filter: TicketFilter,
) {
  const params = new URLSearchParams();

  if (filter !== "ALL") {
    params.set("status", filter);
  }

  params.set(type, message);

  return `/admin/sesizari?${params.toString()}`;
}

export async function updateTicketStatusAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.ADMIN) {
    redirect("/locatar/dashboard");
  }

  const returnFilter = normalizeTicketFilter(formData.get("returnStatus"));

  const parsed = updateTicketStatusSchema.safeParse({
    ticketId: formData.get("ticketId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Date invalide";

    redirect(getAdminTicketsRedirectUrl("error", message, returnFilter));
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
      getAdminTicketsRedirectUrl(
        "error",
        "Sesizarea nu exista sau nu apartine asociatiei administrate.",
        returnFilter,
      ),
    );
  }

  const expectedNextStatus = nextTicketStatus[ticket.status];

  if (!expectedNextStatus) {
    redirect(
      getAdminTicketsRedirectUrl(
        "error",
        "Sesizarea este deja inchisa si nu mai poate fi actualizata.",
        returnFilter,
      ),
    );
  }

  if (parsed.data.status !== expectedNextStatus) {
    redirect(
      getAdminTicketsRedirectUrl(
        "error",
        "Tranzitia de status solicitata nu este permisa.",
        returnFilter,
      ),
    );
  }

  await prisma.ticket.update({
    where: {
      id: ticket.id,
    },
    data: {
      status: expectedNextStatus,
    },
  });

  redirect(
    getAdminTicketsRedirectUrl(
      "success",
      "Statusul sesizarii a fost actualizat.",
      returnFilter,
    ),
  );
}
