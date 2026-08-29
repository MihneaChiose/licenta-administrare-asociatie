"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  InvoiceStatus,
  PaymentStatus,
  UserRole,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const PAYMENT_METHOD_MANUAL = "MANUAL";

const confirmPaymentSchema = z.object({
  paymentId: z.string().min(1, "Plata invalida"),
});

export async function confirmPaymentAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.ADMIN) {
    redirect("/locatar/dashboard");
  }

  const parsed = confirmPaymentSchema.safeParse({
    paymentId: formData.get("paymentId"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Date invalide";
    redirect(`/admin/plati?error=${encodeURIComponent(message)}`);
  }

  const payment = await prisma.payment.findFirst({
    where: {
      id: parsed.data.paymentId,

      invoice: {
        apartment: {
          association: {
            adminId: session.id,
          },
        },
      },
    },

    include: {
      invoice: true,
    },
  });

  if (!payment) {
    redirect(
      `/admin/plati?error=${encodeURIComponent(
        "Plata nu exista sau nu apartine asociatiei administrate.",
      )}`,
    );
  }

  if (payment.method !== PAYMENT_METHOD_MANUAL) {
    redirect(
      `/admin/plati?error=${encodeURIComponent(
        "Platile Stripe sunt confirmate automat si nu pot fi aprobate manual.",
      )}`,
    );
  }

  if (payment.status !== PaymentStatus.PENDING) {
    redirect(
      `/admin/plati?error=${encodeURIComponent(
        "Doar platile aflate in asteptare pot fi confirmate.",
      )}`,
    );
  }

  const paidAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.PAID,
        paidAt,
      },
    });

    await tx.invoice.update({
      where: {
        id: payment.invoiceId,
      },
      data: {
        status: InvoiceStatus.PAID,
        paidAt,
      },
    });
  });

  redirect(
    `/admin/plati?success=${encodeURIComponent(
      "Plata a fost confirmata cu succes.",
    )}`,
  );
}
