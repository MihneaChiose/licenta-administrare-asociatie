import type Stripe from "stripe";
import { InvoiceStatus, PaymentStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

const PAYMENT_METHOD_STRIPE = "STRIPE";

function getWebhookSecret() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }

  return webhookSecret;
}

function getPaymentIntentId(session: Stripe.Checkout.Session) {
  if (!session.payment_intent) {
    return null;
  }

  return typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent.id;
}

async function handleCheckoutCompleted(
  checkoutSession: Stripe.Checkout.Session,
) {
  if (checkoutSession.payment_status !== "paid") {
    return;
  }

  const paymentId = checkoutSession.metadata?.paymentId;
  const invoiceId = checkoutSession.metadata?.invoiceId;

  if (!paymentId || !invoiceId) {
    throw new Error(
      `Stripe Checkout Session ${checkoutSession.id} is missing payment metadata.`,
    );
  }

  const payment = await prisma.payment.findUnique({
    where: {
      id: paymentId,
    },
    include: {
      invoice: true,
    },
  });

  if (!payment) {
    throw new Error(`Payment ${paymentId} was not found.`);
  }

  if (payment.method !== PAYMENT_METHOD_STRIPE) {
    throw new Error(`Payment ${paymentId} is not a Stripe payment.`);
  }

  if (payment.invoiceId !== invoiceId) {
    throw new Error(
      `Invoice metadata mismatch for Stripe payment ${paymentId}.`,
    );
  }

  if (
    payment.providerSessionId &&
    payment.providerSessionId !== checkoutSession.id
  ) {
    throw new Error(
      `Checkout Session mismatch for Stripe payment ${paymentId}.`,
    );
  }

  const expectedAmount = payment.amount.mul(100).toNumber();

  if (
    !Number.isSafeInteger(expectedAmount) ||
    checkoutSession.amount_total !== expectedAmount ||
    checkoutSession.currency?.toLowerCase() !== "ron"
  ) {
    throw new Error(
      `Amount or currency mismatch for Stripe payment ${paymentId}.`,
    );
  }

  if (
    payment.status === PaymentStatus.PAID &&
    payment.invoice.status === InvoiceStatus.PAID
  ) {
    return;
  }

  const paidAt = new Date();
  const providerPaymentId = getPaymentIntentId(checkoutSession);

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.PAID,
        providerSessionId: checkoutSession.id,
        providerPaymentId,
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
}

async function handleCheckoutExpired(checkoutSession: Stripe.Checkout.Session) {
  const paymentId = checkoutSession.metadata?.paymentId;

  if (!paymentId) {
    return;
  }

  const payment = await prisma.payment.findUnique({
    where: {
      id: paymentId,
    },
  });

  if (
    !payment ||
    payment.method !== PAYMENT_METHOD_STRIPE ||
    payment.status !== PaymentStatus.PENDING
  ) {
    return;
  }

  if (
    payment.providerSessionId &&
    payment.providerSessionId !== checkoutSession.id
  ) {
    return;
  }

  await prisma.payment.update({
    where: {
      id: payment.id,
    },
    data: {
      status: PaymentStatus.REJECTED,
      providerSessionId: checkoutSession.id,
    },
  });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing Stripe-Signature header.", {
      status: 400,
    });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      getWebhookSecret(),
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);

    return new Response("Invalid webhook signature.", {
      status: 400,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case "checkout.session.expired":
        await handleCheckoutExpired(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      default:
        break;
    }
  } catch (error) {
    console.error(`Failed to process Stripe event ${event.id}:`, error);

    return new Response("Webhook processing failed.", {
      status: 500,
    });
  }

  return Response.json({
    received: true,
  });
}
