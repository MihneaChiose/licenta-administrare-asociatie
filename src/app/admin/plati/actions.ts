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

  if (payment.status === PaymentStatus.PAID) {
    redirect(
      `/admin/plati?error=${encodeURIComponent("Plata este deja confirmata.")}`,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.PAID,
        paidAt: new Date(),
      },
    });

    await tx.invoice.update({
      where: {
        id: payment.invoiceId,
      },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
      },
    });
  });

  redirect(
    `/admin/plati?success=${encodeURIComponent(
      "Plata a fost confirmata cu succes.",
    )}`,
  );
}
