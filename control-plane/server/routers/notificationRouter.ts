import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { createAuditEntry, createSecurityEvent, getUserTransactions } from "../audit";
import { notifyOwner } from "../_core/notification";

export const notificationRouter = router({
  // ============================================================
  // USER NOTIFICATIONS (payment-related)
  // ============================================================

  getNotifications: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async ({ ctx, input }) => {
      const transactions = await getUserTransactions(ctx.user!.id, input.limit);

      return transactions.map(tx => ({
        id: tx.id,
        type: tx.transactionType,
        provider: tx.provider,
        amount: tx.amount,
        currency: tx.currency,
        status: tx.status,
        message: getNotificationMessage(tx.provider, tx.transactionType, tx.status, tx.amount, tx.currency),
        read: false,
        createdAt: tx.createdAt,
      }));
    }),

  // Notify user about payment event
  sendPaymentNotification: protectedProcedure
    .input(z.object({
      userId: z.number(),
      message: z.string(),
      type: z.enum(["payment_succeeded", "payment_failed", "subscription_activated", "subscription_cancelled", "subscription_expiring", "refund_processed"]),
      amount: z.string().optional(),
      metadata: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await createAuditEntry({
        userId: input.userId,
        actionType: `notification_sent_${input.type}`,
        description: input.message,
        severity: input.type.includes("failed") ? "high" as const : "low" as const,
        entityType: "notification",
        metadata: JSON.stringify({ type: input.type, amount: input.amount, metadata: input.metadata }),
      });

      // Notify owner for critical payment events
      if (input.type === "payment_failed" || input.type === "subscription_cancelled") {
        await notifyOwner({
          title: `Payment Alert: ${input.type}`,
          content: input.message + (input.amount ? `\nAmount: ${input.amount}` : ""),
        });
      }

      return { success: true };
    }),

  // ============================================================
  // OWNER NOTIFICATIONS
  // ============================================================

  notifyOwner: adminProcedure
    .input(z.object({
      title: z.string(),
      content: z.string(),
      severity: z.enum(["low", "medium", "high", "critical"]).optional().default("medium"),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await notifyOwner({
        title: input.title,
        content: input.content,
      });

      await createAuditEntry({
        userId: ctx.user!.id,
        actionType: "owner_notification_sent",
        description: `${input.title}: ${input.content}`,
        severity: input.severity as any,
        entityType: "notification",
      });

      if (input.severity === "critical") {
        await createSecurityEvent({
          eventType: "owner_critical_notification",
          severity: "critical",
          description: `${input.title}: ${input.content}`,
          source: "notification_system",
        });
      }

      return { success: result };
    }),

  // ============================================================
  // WEBHOOK INTEGRATION NOTIFICATIONS
  // ============================================================

  processPaymentWebhook: adminProcedure
    .input(z.object({
      provider: z.enum(["stripe", "mercado_pago"]),
      eventType: z.string(),
      userId: z.number(),
      amount: z.string().optional(),
      metadata: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const notificationType = getWebhookNotificationType(input.provider, input.eventType);

      await createAuditEntry({
        userId: input.userId,
        actionType: `webhook_notification_${notificationType}`,
        description: `Payment webhook from ${input.provider}: ${input.eventType}`,
        severity: notificationType.includes("failed") || notificationType.includes("cancel") ? "high" as const : "low" as const,
        entityType: "notification",
        metadata: JSON.stringify({
          provider: input.provider,
          eventType: input.eventType,
          notificationType,
          amount: input.amount,
        }),
      });

      if (notificationType === "payment_failed" || notificationType === "subscription_cancelled") {
        await notifyOwner({
          title: `Payment Webhook: ${input.eventType}`,
          content: `Provider: ${input.provider}, User ID: ${input.userId}, Amount: ${input.amount || "N/A"}`,
        });
      }

      return { success: true, notificationType };
    }),
});

// Helper: Get notification message from transaction
function getNotificationMessage(
  provider: string,
  type: string,
  status: string,
  amount: string,
  currency: string
): string {
  const amountStr = `${currency} ${amount}`;

  switch (status) {
    case "succeeded":
      return `Payment of ${amountStr} via ${provider} was successful.`;
    case "failed":
      return `Payment of ${amountStr} via ${provider} failed. Please check your payment method.`;
    case "refunded":
      return `Payment of ${amountStr} via ${provider} was refunded.`;
    case "pending":
      return `Payment of ${amountStr} via ${provider} is pending.`;
    default:
      return `${type} via ${provider}: ${status} - ${amountStr}`;
  }
}

// Helper: Get notification type from webhook event
function getWebhookNotificationType(provider: string, eventType: string): string {
  if (eventType === "checkout.session.completed") return "payment_succeeded";
  if (eventType === "charge.failed") return "payment_failed";
  if (eventType === "charge.refunded") return "refund_processed";
  if (eventType === "customer.subscription.created") return "subscription_activated";
  if (eventType === "customer.subscription.deleted") return "subscription_cancelled";
  if (eventType === "customer.subscription.updated") return "subscription_updated";
  if (eventType === "payment_intent.payment_failed") return "payment_failed";
  return "payment_status_update";
}
