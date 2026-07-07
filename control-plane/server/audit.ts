import { eq, desc, gte, count, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { getDb } from "./db";
import {
  securityAuditLog,
  securityEvents,
  failedLoginAttempts,
  userSubscriptions,
  subscriptionPlans,
  paymentTransactions,
  webhookEvents,
} from "../drizzle/schema";
import type {
  InsertSecurityAuditEntry,
  InsertSecurityEvent,
  InsertFailedLoginAttempt,
  InsertUserSubscription,
  InsertSubscriptionPlan,
  InsertPaymentTransaction,
  InsertWebhookEvent,
} from "../drizzle/schema";

// ============================================================
// SECURITY AUDIT LOG
// ============================================================

export async function createAuditEntry(entry: InsertSecurityAuditEntry): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(securityAuditLog).values(entry);
  return (result as any).insertId as number;
}

export async function getAuditEntries(filters?: {
  userId?: number;
  severity?: string;
  actionType?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const base = db.select().from(securityAuditLog);
  const withWhere = filters?.userId ? base.where(eq(securityAuditLog.userId, filters.userId))
    : filters?.severity ? base.where(eq(securityAuditLog.severity, filters.severity as any))
    : filters?.actionType ? base.where(eq(securityAuditLog.actionType, filters.actionType))
    : filters?.fromDate ? base.where(gte(securityAuditLog.timestamp, filters.fromDate))
    : base;

  const withLimit = filters?.limit ? withWhere.limit(filters.limit) : withWhere;
  const withOffset = filters?.offset ? withLimit.offset(filters.offset) : withLimit;

  return await withOffset.orderBy(desc(securityAuditLog.timestamp));
}

export async function getAuditStats(days?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const since = days ? new Date(Date.now() - days * 86400000) : new Date(Date.now() - 30 * 86400000);

  const [
    totalEntries,
    criticalEntries,
    highEntries,
    byAction,
  ] = await Promise.all([
    db.select({ count: count() }).from(securityAuditLog).where(gte(securityAuditLog.timestamp, since)),
    db.select({ count: count() }).from(securityAuditLog).where(eq(securityAuditLog.severity, "critical")),
    db.select({ count: count() }).from(securityAuditLog).where(eq(securityAuditLog.severity, "high")),
    db.select({ action_type: securityAuditLog.actionType, count: count() }).from(securityAuditLog)
      .where(gte(securityAuditLog.timestamp, since))
      .groupBy(securityAuditLog.actionType),
  ]);

  return {
    total: totalEntries[0]?.count ?? 0,
    critical: criticalEntries[0]?.count ?? 0,
    high: highEntries[0]?.count ?? 0,
    byActionType: byAction.map((a: any) => ({ actionType: a.action_type, count: a.count })),
  };
}

// ============================================================
// SECURITY EVENTS
// ============================================================

export async function createSecurityEvent(event: InsertSecurityEvent): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(securityEvents).values(event);
  return (result as any).insertId as number;
}

export async function getSecurityEvents(filters?: {
  severity?: string;
  resolved?: boolean;
  source?: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const base = db.select().from(securityEvents).orderBy(desc(securityEvents.createdAt));
  const withWhere = filters?.severity ? base.where(eq(securityEvents.severity, filters.severity as any))
    : filters?.resolved !== undefined ? base.where(eq(securityEvents.resolved, filters.resolved))
    : filters?.source ? base.where(eq(securityEvents.source, filters.source))
    : base;

  const withLimit = filters?.limit ? withWhere.limit(filters.limit) : withWhere;

  return await withLimit;
}

export async function resolveSecurityEvent(id: number, resolvedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(securityEvents)
    .set({ resolved: true, resolvedAt: new Date(), resolvedBy })
    .where(eq(securityEvents.id, id));
}

export async function getSecurityStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [
    totalEvents,
    criticalEvents,
    unresolvedEvents,
    eventsBySource,
  ] = await Promise.all([
    db.select({ count: count() }).from(securityEvents),
    db.select({ count: count() }).from(securityEvents).where(eq(securityEvents.severity, "critical")),
    db.select({ count: count() }).from(securityEvents).where(eq(securityEvents.resolved, false)),
    db.select({ source: securityEvents.source, count: count() }).from(securityEvents)
      .groupBy(securityEvents.source),
  ]);

  return {
    total: totalEvents[0]?.count ?? 0,
    critical: criticalEvents[0]?.count ?? 0,
    unresolved: unresolvedEvents[0]?.count ?? 0,
    bySource: eventsBySource.map((s: any) => ({ source: s.source, count: s.count })),
  };
}

// ============================================================
// FAILED LOGIN ATTEMPTS
// ============================================================

export async function recordFailedLogin(attempt: InsertFailedLoginAttempt): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(failedLoginAttempts).values(attempt);
  return (result as any).insertId as number;
}

export async function getFailedLoginStats(hours?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const since = hours ? new Date(Date.now() - hours * 3600000) : new Date(Date.now() - 24 * 3600000);

  const [
    totalFailures,
    uniqueIPs,
  ] = await Promise.all([
    db.select({ count: count() }).from(failedLoginAttempts).where(gte(failedLoginAttempts.timestamp, since)),
    db.select({ count: sql<number>`COUNT(DISTINCT ip_address)` }).from(failedLoginAttempts).where(gte(failedLoginAttempts.timestamp, since)),
  ]);

  return {
    total: totalFailures[0]?.count ?? 0,
    uniqueIPs: uniqueIPs[0]?.count ?? 0,
  };
}

// ============================================================
// SUBSCRIPTIONS & BILLING
// ============================================================

export async function createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(subscriptionPlans).values(plan);
  return (result as any).insertId as number;
}

export async function getSubscriptionPlans() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.active, true));
}

export async function getUserSubscription(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.userId, userId))
    .orderBy(desc(userSubscriptions.createdAt))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserSubscription(sub: InsertUserSubscription): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(userSubscriptions).values(sub);
  return (result as any).insertId as number;
}

export async function updateUserSubscription(id: number, updates: Partial<InsertUserSubscription>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(userSubscriptions).set(updates as any).where(eq(userSubscriptions.id, id));
}

// ============================================================
// PAYMENT TRANSACTIONS
// ============================================================

export async function createPaymentTransaction(tx: InsertPaymentTransaction): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(paymentTransactions).values(tx);
  return (result as any).insertId as number;
}

export async function getUserTransactions(userId: number, limit?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const query = db.select().from(paymentTransactions)
    .where(eq(paymentTransactions.userId, userId))
    .orderBy(desc(paymentTransactions.createdAt));
  const withLimit = limit ? query.limit(limit) : query;
  return await withLimit;
}

export async function getTransactionByProviderId(providerId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(paymentTransactions)
    .where(eq(paymentTransactions.providerId, providerId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateTransactionStatus(id: number, status: string, metadata?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (metadata) {
    await db.update(paymentTransactions).set({ status: status as any, metadata }).where(eq(paymentTransactions.id, id));
  } else {
    await db.update(paymentTransactions).set({ status: status as any }).where(eq(paymentTransactions.id, id));
  }
}

// ============================================================
// WEBHOOK EVENTS
// ============================================================

export async function createWebhookEvent(event: InsertWebhookEvent): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(webhookEvents).values(event);
  return (result as any).insertId as number;
}

export async function getWebhookEventById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(webhookEvents).where(eq(webhookEvents.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateWebhookEvent(id: number, updates: Partial<InsertWebhookEvent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(webhookEvents).set(updates as any).where(eq(webhookEvents.id, id));
}
