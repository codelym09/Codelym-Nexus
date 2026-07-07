import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { getSubscriptionPlans, getUserSubscription, createUserSubscription, createPaymentTransaction } from "../audit";
import { getDb } from "../db";
import { ENV } from "../_core/env";
import { desc } from "drizzle-orm";
import { userSubscriptions, paymentTransactions } from "../../drizzle/schema";

// ============================================================
// STRIPE CHECKOUT SESSION
// ============================================================

export async function createCheckoutSession(userId: number, planId: number, priceId?: string) {
  // In production, use the real Stripe SDK
  // const stripe = new Stripe(ENV.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' });
  
  // For now, we create the session record and return mock session data
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Create a pending transaction
  const txId = await createPaymentTransaction({
    userId,
    subscriptionId: null,
    provider: "stripe",
    transactionType: "payment",
    amount: "0.00",
    currency: "USD",
    providerId: `stripe_checkout_${Date.now()}_${userId}_${planId}`,
    status: "pending",
    metadata: JSON.stringify({ planId, type: "checkout_session" }),
  });

  return {
    sessionId: `cs_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    url: `https://checkout.stripe.com/pay/cs_test_${planId}`,
    transactionId: txId,
    provider: "stripe",
  };
}

// ============================================================
// MERCADOPAGO CHECKOUT SESSION
// ============================================================

export async function createMercadopagoSession(userId: number, planId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const txId = await createPaymentTransaction({
    userId,
    subscriptionId: null,
    provider: "mercado_pago",
    transactionType: "payment",
    amount: "0.00",
    currency: "ARS",
    providerId: `mp_pref_${Date.now()}_${userId}_${planId}`,
    status: "pending",
    metadata: JSON.stringify({ planId, type: "mercado_pago_preference" }),
  });

  return {
    preferenceId: `pref_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    initPoint: `https://mpago.la/2xMYCrd`,
    sandboxInitPoint: `https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=${txId}`,
    transactionId: txId,
    provider: "mercado_pago",
  };
}

// ============================================================
// ROUTER
// ============================================================

export const paymentRouter = router({
  // Get available subscription plans
  getPlans: protectedProcedure.query(async () => {
    return await getSubscriptionPlans();
  }),

  // Get current user's subscription
  getMySubscription: protectedProcedure.query(async ({ ctx }) => {
    return await getUserSubscription(ctx.user!.id);
  }),

  // Get current user's transactions
  getMyTransactions: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).optional().default(20) }))
    .query(async ({ ctx, input }) => {
      const { getUserTransactions } = await import("../audit");
      return await getUserTransactions(ctx.user!.id, input.limit);
    }),

  // Create Stripe checkout session
  createCheckoutSession: protectedProcedure
    .input(z.object({ planId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      return await createCheckoutSession(ctx.user!.id, input.planId);
    }),

  // Create MercadoPago checkout preference
  createMercadopagoSession: protectedProcedure
    .input(z.object({ planId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      return await createMercadopagoSession(ctx.user!.id, input.planId);
    }),

  // Cancel subscription
  cancelSubscription: protectedProcedure
    .input(z.object({ reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const sub = await getUserSubscription(ctx.user!.id);
      if (!sub) throw new Error("No active subscription found");

      const subId = sub.id;
      const { updateUserSubscription } = await import("../audit");
      await updateUserSubscription(subId, {
        cancelAtPeriodEnd: true,
      });

      return { success: true, currentPeriodEnd: sub.currentPeriodEnd };
    }),

  // Admin: Create subscription plan
  createPlan: adminProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      price: z.string(),
      currency: z.string().optional().default("USD"),
      billingInterval: z.enum(["monthly", "yearly"]).optional().default("monthly"),
      features: z.string().optional(),
      stripePriceId: z.string().optional(),
      mercadoPagoPriceId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { createSubscriptionPlan } = await import("../audit");
      const planId = await createSubscriptionPlan({
        name: input.name,
        description: input.description,
        price: input.price,
        currency: input.currency,
        billingInterval: input.billingInterval,
        features: input.features,
        stripePriceId: input.stripePriceId,
        mercadoPagoPriceId: input.mercadoPagoPriceId,
      });

      return { success: true, planId };
    }),

  // Admin: View all subscriptions
  listAllSubscriptions: adminProcedure
    .input(z.object({ limit: z.number().optional().default(50) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return await db.select().from(userSubscriptions)
        .limit(input.limit)
        .orderBy(desc(userSubscriptions.createdAt));
    }),

  // Admin: View all payment transactions
  listAllTransactions: adminProcedure
    .input(z.object({ limit: z.number().optional().default(100) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return await db.select().from(paymentTransactions)
        .limit(input.limit)
        .orderBy(desc(paymentTransactions.createdAt));
    }),
});
