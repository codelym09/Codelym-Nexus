import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { desc, count, eq, sql, gte, like } from "drizzle-orm";
import {
  users,
  workflows,
  securityAuditLog,
  securityEvents,
  paymentTransactions,
  userSubscriptions,
  failedLoginAttempts,
} from "../../drizzle/schema";

export const adminRouter = router({
  // ============================================================
  // DASHBOARD OVERVIEW
  // ============================================================

  getOverview: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [
      totalUsers,
      totalWorkflows,
      totalSubscriptions,
      totalRevenue,
      activeSubscriptions,
      criticalEvents,
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(workflows),
      db.select({ count: count() }).from(userSubscriptions),
      db.select({ total: sql<number>`SUM(amount)` }).from(paymentTransactions).where(eq(paymentTransactions.status, "succeeded")),
      db.select({ count: count() }).from(userSubscriptions).where(eq(userSubscriptions.status, "active")),
      db.select({ count: count() }).from(securityEvents).where(
        sql`${securityEvents.severity} = 'critical' AND ${securityEvents.resolved} = 0`
      ),
    ]);

    return {
      totalUsers: totalUsers[0]?.count ?? 0,
      totalWorkflows: totalWorkflows[0]?.count ?? 0,
      totalSubscriptions: totalSubscriptions[0]?.count ?? 0,
      totalRevenue: totalRevenue[0]?.total ?? 0,
      activeSubscriptions: activeSubscriptions[0]?.count ?? 0,
      criticalEvents: criticalEvents[0]?.count ?? 0,
    };
  }),

  // ============================================================
  // USER MANAGEMENT
  // ============================================================

  listUsers: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(200).optional().default(50),
      offset: z.number().optional().default(0),
      role: z.enum(["user", "admin"]).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const query = input.role
        ? db.select().from(users).where(eq(users.role, input.role))
        : db.select().from(users);

      const result = await query
        .limit(input.limit)
        .offset(input.offset)
        .orderBy(desc(users.createdAt));

      return result.map(u => ({
        ...u,
        openId: undefined,
      }));
    }),

  updateUserRole: adminProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(["user", "admin"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existing = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (existing.length === 0) throw new Error("User not found");

      await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));

      return { success: true };
    }),

  // ============================================================
  // WORKFLOW MANAGEMENT
  // ============================================================

  getAllWorkflows: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(500).optional().default(50),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const query = input.status
        ? db.select().from(workflows).where(eq(workflows.status, input.status as any))
        : db.select().from(workflows);

      return await query
        .limit(input.limit)
        .orderBy(desc(workflows.createdAt));
    }),

  // ============================================================
  // FINANCIAL DASHBOARD
  // ============================================================

  getFinancialOverview: adminProcedure
    .input(z.object({ days: z.number().optional().default(30) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const since = new Date(Date.now() - input.days * 86400000);

      const [
        totalRevenue,
        recentTransactions,
        revenueByProvider,
        failedPayments,
      ] = await Promise.all([
        db.select({ total: sql<number>`SUM(amount)` }).from(paymentTransactions).where(eq(paymentTransactions.status, "succeeded")),
        db.select().from(paymentTransactions).where(gte(paymentTransactions.createdAt, since)).orderBy(desc(paymentTransactions.createdAt)).limit(10),
        db.select({ provider: paymentTransactions.provider, total: sql<number>`SUM(amount)` }).from(paymentTransactions).where(eq(paymentTransactions.status, "succeeded")).groupBy(paymentTransactions.provider),
        db.select({ count: count() }).from(paymentTransactions).where(eq(paymentTransactions.status, "failed")),
      ]);

      return {
        totalRevenue: totalRevenue[0]?.total ?? 0,
        recentTransactions,
        revenueByProvider: revenueByProvider.map((p: any) => ({
          provider: p.provider,
          total: p.total,
        })),
        failedPayments: failedPayments[0]?.count ?? 0,
      };
    }),

  // ============================================================
  // SECURITY DASHBOARD
  // ============================================================

  getSecurityOverview: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [
      totalAuditEntries,
      recentCriticalEvents,
      recentFailedLogins,
      unresolvedEvents,
    ] = await Promise.all([
      db.select({ count: count() }).from(securityAuditLog),
      db.select().from(securityEvents).where(eq(securityEvents.severity, "critical")).orderBy(desc(securityEvents.createdAt)).limit(10),
      db.select().from(failedLoginAttempts).orderBy(desc(failedLoginAttempts.timestamp)).limit(20),
      db.select({ count: count() }).from(securityEvents).where(eq(securityEvents.resolved, false)),
    ]);

    return {
      totalAuditEntries: totalAuditEntries[0]?.count ?? 0,
      recentCriticalEvents,
      recentFailedLogins,
      unresolvedEvents: unresolvedEvents[0]?.count ?? 0,
    };
  }),

  // ============================================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================================

  getSubscriptionOverview: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [
      byStatus,
      recentChanges,
      churnData,
    ] = await Promise.all([
      db.select({ status: userSubscriptions.status, count: count() }).from(userSubscriptions).groupBy(userSubscriptions.status),
      db.select().from(userSubscriptions).where(gte(userSubscriptions.updatedAt, new Date(Date.now() - 7 * 86400000))).orderBy(desc(userSubscriptions.updatedAt)).limit(10),
      db.select({
        active: sql<number>`SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END)`,
        canceled: sql<number>`SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END)`,
      }).from(userSubscriptions),
    ]);

    const activeCount = (churnData[0] as any)?.active ?? 0;
    const canceledCount = (churnData[0] as any)?.canceled ?? 0;
    const total = activeCount + canceledCount;

    return {
      byStatus: byStatus.map((s: any) => ({ status: s.status, count: s.count })),
      recentChanges,
      churnRate: total > 0 ? canceledCount / total : 0,
    };
  }),
});
