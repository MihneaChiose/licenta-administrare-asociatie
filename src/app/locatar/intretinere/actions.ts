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
import { stripe } from "@/lib/stripe";

const PAYMENT_METHOD_MANUAL = "MANUAL";
const PAYMENT_METHOD_STRIPE = "STRIPE";

const requestPaymentSchema = z.object({
  invoiceId: z.string().min(1, "Factura invalida"),
});

function getAppUrl() {
  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    throw new Error("APP_URL is not configured.");
  }

  return appUrl.replace(/\/$/, "");
}

function getMaintenanceErrorUrl(message: string) {
  return `/locatar/intretinere?error=${encodeURIComponent(message)}`;
}

function getMaintenanceSuccessUrl(message: string) {
  return `/locatar/intretinere?success=${encodeURIComponent(message)}`;
}

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
    redirect(getMaintenanceErrorUrl(message));
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
      getMaintenanceErrorUrl("Factura nu exista sau nu apartine contului tau."),
    );
  }

  if (invoice.status === InvoiceStatus.PAID) {
    redirect(getMaintenanceErrorUrl("Factura este deja platita."));
  }

  const hasPendingPayment = invoice.payments.some(
    (payment) => payment.status === PaymentStatus.PENDING,
  );

  if (hasPendingPayment || invoice.status === InvoiceStatus.PENDING) {
    redirect(
      getMaintenanceErrorUrl(
        "Exista deja o plata in asteptare pentru aceasta factura.",
      ),
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: invoice.totalAmount,
        method: PAYMENT_METHOD_MANUAL,
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
    getMaintenanceSuccessUrl(
      "Cererea de plata a fost trimisa catre administrator.",
    ),
  );
}

export async function startStripeCheckoutAction(formData: FormData) {
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
    redirect(getMaintenanceErrorUrl(message));
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

      apartment: {
        select: {
          number: true,
        },
      },
    },
  });

  if (!invoice) {
    redirect(
      getMaintenanceErrorUrl("Factura nu exista sau nu apartine contului tau."),
    );
  }

  if (invoice.status === InvoiceStatus.PAID) {
    redirect(getMaintenanceErrorUrl("Factura este deja platita."));
  }

  if (invoice.status === InvoiceStatus.PENDING) {
    redirect(
      getMaintenanceErrorUrl(
        "Exista deja o cerere de plata manuala in asteptare pentru aceasta factura.",
      ),
    );
  }

  const pendingManualPayment = invoice.payments.find(
    (payment) =>
      payment.status === PaymentStatus.PENDING &&
      payment.method === PAYMENT_METHOD_MANUAL,
  );

  if (pendingManualPayment) {
    redirect(
      getMaintenanceErrorUrl(
        "Exista deja o cerere de plata manuala in asteptare pentru aceasta factura.",
      ),
    );
  }

  const pendingStripePayment = invoice.payments.find(
    (payment) =>
      payment.status === PaymentStatus.PENDING &&
      payment.method === PAYMENT_METHOD_STRIPE,
  );

  if (pendingStripePayment?.providerSessionId) {
    let existingCheckoutSession;

    try {
      existingCheckoutSession = await stripe.checkout.sessions.retrieve(
        pendingStripePayment.providerSessionId,
      );
    } catch (error) {
      console.error("Failed to retrieve Stripe Checkout Session:", error);

      redirect(
        getMaintenanceErrorUrl(
          "Nu am putut verifica plata Stripe existenta. Incearca din nou.",
        ),
      );
    }

    if (
      existingCheckoutSession.status === "open" &&
      existingCheckoutSession.url
    ) {
      redirect(existingCheckoutSession.url);
    }

    if (existingCheckoutSession.status === "complete") {
      redirect(
        getMaintenanceSuccessUrl(
          "Plata a fost procesata de Stripe si asteapta confirmarea automata.",
        ),
      );
    }

    if (existingCheckoutSession.status === "expired") {
      await prisma.payment.update({
        where: {
          id: pendingStripePayment.id,
        },
        data: {
          status: PaymentStatus.REJECTED,
        },
      });
    }
  } else if (pendingStripePayment) {
    await prisma.payment.update({
      where: {
        id: pendingStripePayment.id,
      },
      data: {
        status: PaymentStatus.REJECTED,
      },
    });
  }

  const amountInMinorUnits = invoice.totalAmount.mul(100).toNumber();

  if (!Number.isSafeInteger(amountInMinorUnits) || amountInMinorUnits <= 0) {
    redirect(
      getMaintenanceErrorUrl(
        "Suma facturii nu poate fi procesata pentru plata online.",
      ),
    );
  }

  const payment = await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      amount: invoice.totalAmount,
      method: PAYMENT_METHOD_STRIPE,
      status: PaymentStatus.PENDING,
    },
  });

  const appUrl = getAppUrl();

  const successMessage = encodeURIComponent(
    "Plata a fost procesata de Stripe. Statusul facturii se actualizeaza automat.",
  );

  const cancelMessage = encodeURIComponent(
    "Plata online a fost anulata. O poti continua sau relua ulterior.",
  );

  let checkoutSession;

  try {
    checkoutSession = await stripe.checkout.sessions.create(
      {
        mode: "payment",

        payment_method_types: ["card"],

        client_reference_id: payment.id,

        locale: "ro",

        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,

        line_items: [
          {
            quantity: 1,

            price_data: {
              currency: "ron",

              unit_amount: amountInMinorUnits,

              product_data: {
                name: `Intretinere ${invoice.month}/${invoice.year}`,
                description: `Apartament ${invoice.apartment.number}`,
              },
            },
          },
        ],

        metadata: {
          paymentId: payment.id,
          invoiceId: invoice.id,
        },

        payment_intent_data: {
          metadata: {
            paymentId: payment.id,
            invoiceId: invoice.id,
          },
        },

        success_url:
          `${appUrl}/locatar/intretinere` +
          `?success=${successMessage}` +
          `&session_id={CHECKOUT_SESSION_ID}`,

        cancel_url: `${appUrl}/locatar/intretinere` + `?error=${cancelMessage}`,
      },
      {
        idempotencyKey: `payment-${payment.id}`,
      },
    );
  } catch (error) {
    console.error("Failed to create Stripe Checkout Session:", error);

    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.REJECTED,
      },
    });

    redirect(
      getMaintenanceErrorUrl(
        "Nu am putut initializa plata Stripe. Incearca din nou.",
      ),
    );
  }

  if (!checkoutSession.url) {
    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.REJECTED,
      },
    });

    redirect(
      getMaintenanceErrorUrl("Stripe nu a returnat o pagina valida de plata."),
    );
  }

  await prisma.payment.update({
    where: {
      id: payment.id,
    },
    data: {
      providerSessionId: checkoutSession.id,
    },
  });

  redirect(checkoutSession.url);
}
