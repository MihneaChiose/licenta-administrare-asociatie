"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  InvoiceStatus,
  MaintenanceListStatus,
  PaymentStatus,
  UserRole,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const requestPaymentSchema = z.object({
  invoiceId: z.string().min(1, "Factura invalida"),
});

export async function requestPaymentAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== UserRole.TENANT) {
    redirect("/admin/dashboard");
  }

  const parsed = requestPaymentSchema.safeParse({
    invoiceId: formData.get("invoiceId"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Date invalide";
    redirect(`/locatar/intretinere?error=${encodeURIComponent(message)}`);
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: parsed.data.invoiceId,

      apartment: {
        ownerId: session.id,
      },

      maintenanceList: {
        status: {
          in: [MaintenanceListStatus.PUBLISHED, MaintenanceListStatus.CLOSED],
        },
      },
    },
    include: {
      payments: true,
    },
  });

  if (!invoice) {
    redirect(
      `/locatar/intretinere?error=${encodeURIComponent(
        "Factura nu exista sau nu apartine contului tau.",
      )}`,
    );
  }

  if (invoice.status === InvoiceStatus.PAID) {
    redirect(
      `/locatar/intretinere?error=${encodeURIComponent(
        "Factura este deja platita.",
      )}`,
    );
  }

  const hasPendingPayment = invoice.payments.some(
    (payment) => payment.status === PaymentStatus.PENDING,
  );

  if (hasPendingPayment || invoice.status === InvoiceStatus.PENDING) {
    redirect(
      `/locatar/intretinere?error=${encodeURIComponent(
        "Exista deja o plata in asteptare pentru aceasta factura.",
      )}`,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: invoice.totalAmount,
        method: "MANUAL",
        status: PaymentStatus.PENDING,
      },
    });

    await tx.invoice.update({
      where: {
        id: invoice.id,
      },
      data: {
        status: InvoiceStatus.PENDING,
      },
    });
  });

  redirect(
    `/locatar/intretinere?success=${encodeURIComponent(
      "Cererea de plata a fost trimisa catre administrator.",
    )}`,
  );
}
