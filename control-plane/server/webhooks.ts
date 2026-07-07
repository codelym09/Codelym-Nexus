import { Request, Response } from "express";
import { ENV } from "./_core/env";
import {
  createWebhookEvent,
  getWebhookEventById,
  updateWebhookEvent,
  createPaymentTransaction,
  updateUserSubscription,
  createAuditEntry,
  createSecurityEvent,
} from "./audit";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { webhookEvents, paymentTransactions, userSubscriptions } from "../drizzle/schema";

// ============================================================
// STRIPE WEBHOOK ENDPOINT
// ============================================================

export async function handleStripeWebhook(req: Request, res: Response) {
  try {
    // Verify Stripe signature in production
    // const sig = req.headers['stripe-signature'] as string;
    // const event = stripe.webhooks.constructEvent(req.body, sig, ENV.STRIPE_WEBHOOK_SECRET!);

    const payload = req.body;
    const { type: eventType, id: providerEventId, data } = payload;

    // Check for duplicate event
    const db = await getDb();
    if (!db) {
      return res.status(503).json({ error: "Database unavailable" });
    }

    const existing = await db.select().from(webhookEvents)
      .where(eq(webhookEvents.providerEventId, String(providerEventId)))
      .limit(1);

    if (existing.length > 0 && existing[0].processed) {
      return res.status(200).json({ received: true, duplicate: true });
    }

    // Record the webhook event
    const webhookId = await createWebhookEvent({
      provider: "stripe",
      eventType,
      providerEventId: String(providerEventId),
      payload: JSON.stringify(payload),
      processed: false,
    });

    try {
      const eventObj = data?.object;
      await processStripeEvent(eventObj, eventType, db);

      // Mark as processed
      await updateWebhookEvent(webhookId, { processed: true, processedAt: new Date() });

      // Log audit
      await createAuditEntry({
        userId: null,
        actionType: "webhook_received",
        description: `Stripe webhook: ${eventType}`,
        severity: "low",
        entityType: "payment",
        metadata: JSON.stringify({ eventType, providerEventId }),
      });

      res.status(200).json({ received: true, webhookId });
    } catch (error) {
      await updateWebhookEvent(webhookId, {
        processed: true,
        processedAt: new Date(),
        processingResult: JSON.stringify({ error: String(error) }),
      });

      // Create security event for critical failures
      if (eventType.includes("charge") || eventType.includes("subscription")) {
        await createSecurityEvent({
          eventType: `webhook_processing_error: ${eventType}`,
          severity: "high",
          description: `Failed to process Stripe webhook: ${String(error)}`,
          source: "stripe_webhook",
          metadata: JSON.stringify({ webhookId, eventType, error: String(error) }),
        });
      }

      res.status(500).json({ error: "Processing failed", webhookId });
    }
  } catch (error) {
    console.error("[Stripe Webhook] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ============================================================
// MERCADOPAGO WEBHOOK ENDPOINT
// ============================================================

export async function handleMercadoPagoWebhook(req: Request, res: Response) {
  try {
    const payload = req.body;
    const { type: eventType, id: providerEventId, action, topic, resource } = payload;

    const db = await getDb();
    if (!db) {
      return res.status(503).json({ error: "Database unavailable" });
    }

    // Record the webhook event
    const webhookId = await createWebhookEvent({
      provider: "mercado_pago",
      eventType: `${eventType}_${action}`,
      providerEventId: String(providerEventId),
      payload: JSON.stringify(payload),
      processed: false,
    });

    try {
      if (topic === "payment") {
        // In production, fetch full payment details from MP API
        // const mpResponse = await axios.get(`https://api.mercadopago.com/v1/payments/${providerEventId}`, {
        //   headers: { Authorization: `Bearer ${ENV.MERCADOPAGO_ACCESS_TOKEN}` }
        // });
        
        const paymentData = resource;
        const mpStatus = paymentData?.status || "pending";

        // Find transaction
        const transactions = await db.select().from(paymentTransactions)
          .where(eq(paymentTransactions.providerId, String(providerEventId)))
          .limit(1);

        if (transactions.length > 0) {
          const newStatus = mpStatus === "approved" ? "succeeded"
            : mpStatus === "rejected" ? "failed"
            : mpStatus === "refunded" ? "refunded"
            : "pending";

          await updateTransactionStatus(transactions[0].id, newStatus,
            JSON.stringify({ mercadoPagoStatus: mpStatus, paymentData }));
        }
      } else if (topic === "preapproval") {
        // Subscription update
        const subscriptionId = String(providerEventId);
        const subscriptions = await db.select().from(userSubscriptions)
          .where(eq(userSubscriptions.mercadoPagoSubscriptionId, subscriptionId))
          .limit(1);

        if (subscriptions.length > 0) {
          const mpStatus = resource?.status || "pending";
          await updateUserSubscription(subscriptions[0].id, {
            status: mpStatus === "active" ? "active"
              : mpStatus === "cancelled" ? "canceled"
              : mpStatus as any,
          });
        }
      }

      await updateWebhookEvent(webhookId, { processed: true, processedAt: new Date() });

      // Audit
      await createAuditEntry({
        userId: null,
        actionType: "webhook_received",
        description: `MercadoPago webhook: ${eventType}_${action}`,
        severity: "low",
        entityType: "payment",
        metadata: JSON.stringify({ eventType, action, providerEventId }),
      });

      res.status(200).json({ received: true, webhookId });
    } catch (error) {
      await updateWebhookEvent(webhookId, {
        processed: true,
        processedAt: new Date(),
        processingResult: JSON.stringify({ error: String(error) }),
      });

      res.status(500).json({ error: "Processing failed", webhookId });
    }
  } catch (error) {
    console.error("[MercadoPago Webhook] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ============================================================
// HELPER: Process Stripe Event Data
// ============================================================

async function processStripeEvent(eventObj: any, eventType: string, db: any) {
  if (!eventObj) return;

  switch (eventType) {
    case "checkout.session.completed": {
      const sessionId = eventObj.id;
      const customerId = eventObj.customer;
      const subscriptionId = eventObj.subscription;

      // Update transaction
      const transactions = await db.select().from(paymentTransactions)
        .where(eq(paymentTransactions.providerId, sessionId))
        .limit(1);

      if (transactions.length > 0) {
        await updateTransactionStatus(transactions[0].id, "succeeded",
          JSON.stringify({ stripeSessionId: sessionId, customerId, subscriptionId }));
      }

      // Activate subscription
      if (subscriptionId) {
        const subs = await db.select().from(userSubscriptions)
          .where(eq(userSubscriptions.stripeCustomerId, customerId))
          .limit(1);

        if (subs.length > 0) {
          await updateUserSubscription(subs[0].id, {
            stripeSubscriptionId: subscriptionId,
            status: "active",
            currentPeriodStart: eventObj.created ? new Date(eventObj.created * 1000) : undefined,
          });
        }
      }
      break;
    }

    case "customer.subscription.updated": {
      const subId = eventObj.id;
      const status = eventObj.status;
      const subs = await db.select().from(userSubscriptions)
        .where(eq(userSubscriptions.stripeSubscriptionId, subId))
        .limit(1);

      if (subs.length > 0) {
        await updateUserSubscription(subs[0].id, {
          status: status as any,
          currentPeriodStart: eventObj.current_period_start ? new Date(eventObj.current_period_start * 1000) : undefined,
          currentPeriodEnd: eventObj.current_period_end ? new Date(eventObj.current_period_end * 1000) : undefined,
          cancelAtPeriodEnd: eventObj.cancel_at_period_end ?? false,
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subId = eventObj.id;
      const subs = await db.select().from(userSubscriptions)
        .where(eq(userSubscriptions.stripeSubscriptionId, subId))
        .limit(1);

      if (subs.length > 0) {
        await updateUserSubscription(subs[0].id, {
          status: "canceled",
          canceledAt: new Date(),
        });
      }
      break;
    }

    case "charge.failed": {
      const chargeId = eventObj.id;
      const transactions = await db.select().from(paymentTransactions)
        .where(eq(paymentTransactions.providerId, chargeId))
        .limit(1);

      if (transactions.length > 0) {
        await updateTransactionStatus(transactions[0].id, "failed",
          JSON.stringify({ error: eventObj.failure_message }));

        // Create security event for failed charge
        await createSecurityEvent({
          eventType: "payment_failed",
          severity: "medium",
          description: `Stripe charge failed: ${eventObj.failure_message || "Unknown error"}`,
          source: "stripe_webhook",
          affectedUserId: transactions[0].userId,
          metadata: JSON.stringify({ chargeId, failureMessage: eventObj.failure_message }),
        });
      }
      break;
    }

    case "charge.refunded": {
      const chargeId = eventObj.id;
      const transactions = await db.select().from(paymentTransactions)
        .where(eq(paymentTransactions.providerId, chargeId))
        .limit(1);

      if (transactions.length > 0) {
        await updateTransactionStatus(transactions[0].id, "refunded",
          JSON.stringify({ refundAmount: eventObj.amount_refunded }));
      }
      break;
    }

    case "payment_intent.payment_failed": {
      // Create security event
      await createSecurityEvent({
        eventType: "payment_intent_failed",
        severity: "medium",
        description: `Payment intent failed: ${eventObj.last_payment_error?.message || "Unknown"}`,
        source: "stripe_webhook",
        affectedUserId: null,
        metadata: JSON.stringify({ paymentIntentId: eventObj.id }),
      });
      break;
    }
  }
}

async function updateTransactionStatus(id: number, status: string, metadata?: string) {
  const { updateTransactionStatus: updateTx } = await import("./audit");
  await updateTx(id, status, metadata);
}
