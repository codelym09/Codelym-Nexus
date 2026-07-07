import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { createWebhookEvent, getWebhookEventById, updateWebhookEvent } from "../audit";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { webhookEvents, paymentTransactions, userSubscriptions } from "../../drizzle/schema";

// ============================================================
// STRIPE WEBHOOK HANDLER
// ============================================================

async function handleStripeEvent(payload: any) {
  const { type: eventType, id: providerEventId } = payload;

  // Check for duplicate
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(webhookEvents)
    .where(eq(webhookEvents.providerEventId, providerEventId))
    .limit(1);
  
  if (existing.length > 0 && existing[0].processed) {
    return { processed: false, reason: "duplicate" };
  }

  // Create webhook event record
  const webhookId = await createWebhookEvent({
    provider: "stripe",
    eventType,
    providerEventId,
    payload: JSON.stringify(payload),
    processed: false,
  });

  try {
    const data = payload.data?.object;

    switch (eventType) {
      case "checkout.session.completed": {
        const sessionId = data?.id;
        const customerId = data?.customer;
        const subscriptionId = data?.subscription;

        // Find or create transaction
        const transactions = await db.select().from(paymentTransactions)
          .where(eq(paymentTransactions.providerId, sessionId))
          .limit(1);

        if (transactions.length > 0) {
          await updateTransactionStatus(transactions[0].id, "succeeded",
            JSON.stringify({ stripeSessionId: sessionId, customerId, subscriptionId }));
        }

        // Create subscription if needed
        if (subscriptionId) {
          const subscriptions = await db.select().from(userSubscriptions)
            .where(eq(userSubscriptions.stripeCustomerId, customerId))
            .limit(1);

          if (subscriptions.length > 0) {
            const { updateUserSubscription } = await import("../audit");
            await updateUserSubscription(subscriptions[0].id, {
              stripeSubscriptionId: subscriptionId,
              status: "active",
            });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subId = data?.id;
        const status = data?.status;
        const subscriptions = await db.select().from(userSubscriptions)
          .where(eq(userSubscriptions.stripeSubscriptionId, subId))
          .limit(1);

        if (subscriptions.length > 0) {
          const { updateUserSubscription } = await import("../audit");
          await updateUserSubscription(subscriptions[0].id, {
            status: status as any,
            currentPeriodStart: data?.current_period_start ? new Date(data.current_period_start * 1000) : undefined,
            currentPeriodEnd: data?.current_period_end ? new Date(data.current_period_end * 1000) : undefined,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subId = data?.id;
        const subscriptions = await db.select().from(userSubscriptions)
          .where(eq(userSubscriptions.stripeSubscriptionId, subId))
          .limit(1);

        if (subscriptions.length > 0) {
          const { updateUserSubscription } = await import("../audit");
          await updateUserSubscription(subscriptions[0].id, {
            status: "canceled",
            canceledAt: new Date(),
          });
        }
        break;
      }

      case "charge.failed": {
        const chargeId = data?.id;
        const transactions = await db.select().from(paymentTransactions)
          .where(eq(paymentTransactions.providerId, chargeId))
          .limit(1);

        if (transactions.length > 0) {
          await updateTransactionStatus(transactions[0].id, "failed",
            JSON.stringify({ error: data?.failure_message }));
        }
        break;
      }

      case "charge.refunded": {
        const chargeId = data?.id;
        const transactions = await db.select().from(paymentTransactions)
          .where(eq(paymentTransactions.providerId, chargeId))
          .limit(1);

        if (transactions.length > 0) {
          await updateTransactionStatus(transactions[0].id, "refunded",
            JSON.stringify({ refundAmount: data?.amount_refunded }));
        }
        break;
      }
    }

    // Mark webhook as processed
    await updateWebhookEvent(webhookId, { processed: true, processedAt: new Date() });

    return { processed: true, webhookId };
  } catch (error) {
    await updateWebhookEvent(webhookId, {
      processed: true,
      processedAt: new Date(),
      processingResult: JSON.stringify({ error: String(error) }),
    });
    return { processed: false, webhookId, error: String(error) };
  }
}

// ============================================================
// MERCADOPAGO WEBHOOK HANDLER
// ============================================================

async function handleMercadoPagoEvent(payload: any) {
  const { type: eventType, id: providerEventId, action } = payload;
  const topic = payload.topic;

  // Create webhook event record
  const webhookId = await createWebhookEvent({
    provider: "mercado_pago",
    eventType: `${eventType}_${action}`,
    providerEventId: String(providerEventId),
    payload: JSON.stringify(payload),
    processed: false,
  });

  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (topic === "payment") {
      // Find transaction by provider ID
      const transactions = await db.select().from(paymentTransactions)
        .where(eq(paymentTransactions.providerId, String(providerEventId)))
        .limit(1);

      if (transactions.length > 0) {
        const paymentData = payload.resource;
        const status = paymentData?.status || "pending";
        const newStatus = status === "approved" ? "succeeded"
          : status === "rejected" ? "failed"
          : status === "refunded" ? "refunded"
          : "pending";

        await updateTransactionStatus(transactions[0].id, newStatus,
          JSON.stringify(paymentData));
      }
    } else if (topic === "preapproval") {
      const subscriptionId = String(providerEventId);
      const subscriptions = await db.select().from(userSubscriptions)
        .where(eq(userSubscriptions.mercadoPagoSubscriptionId, subscriptionId))
        .limit(1);

      if (subscriptions.length > 0) {
        const { updateUserSubscription } = await import("../audit");
        const status = payload.resource?.status || "pending";
        await updateUserSubscription(subscriptions[0].id, {
          status: status === "active" ? "active"
            : status === "cancelled" ? "canceled"
            : status as any,
        });
      }
    }

    await updateWebhookEvent(webhookId, { processed: true, processedAt: new Date() });
    return { processed: true, webhookId };
  } catch (error) {
    await updateWebhookEvent(webhookId, {
      processed: true,
      processedAt: new Date(),
      processingResult: JSON.stringify({ error: String(error) }),
    });
    return { processed: false, webhookId, error: String(error) };
  }
}

// ============================================================
// ROUTER
// ============================================================

export const webhookRouter = router({
  // Receive Stripe webhook
  receiveStripe: publicProcedure
    .input(z.object({
      type: z.string(),
      data: z.object({
        object: z.object({}).passthrough().optional(),
      }).optional(),
      id: z.string().optional(),
      object: z.string().optional(),
      api_version: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await handleStripeEvent(input);
    }),

  // Receive MercadoPago webhook
  receiveMercadoPago: publicProcedure
    .input(z.object({
      type: z.string(),
      id: z.string().optional(),
      action: z.string().optional(),
      topic: z.string().optional(),
      resource: z.object({}).passthrough().optional(),
    }))
    .mutation(async ({ input }) => {
      return await handleMercadoPagoEvent(input);
    }),

  // Get webhook event status (for debugging)
  getWebhookStatus: publicProcedure
    .input(z.object({ webhookId: z.number() }))
    .query(async ({ input }) => {
      return await getWebhookEventById(input.webhookId);
    }),
});

async function updateTransactionStatus(id: number, status: string, metadata?: string) {
  const { updateTransactionStatus: updateTx } = await import("../audit");
  await updateTx(id, status, metadata);
}
