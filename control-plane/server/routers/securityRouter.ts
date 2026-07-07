import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import {
  createAuditEntry,
  getAuditEntries,
  getAuditStats,
  createSecurityEvent,
  getSecurityEvents,
  getSecurityStats,
  resolveSecurityEvent,
  getFailedLoginStats,
} from "../audit";
import { getDb } from "../db";
import { desc, eq } from "drizzle-orm";
import { paymentTransactions } from "../../drizzle/schema";

export const securityRouter = router({
  // ============================================================
  // AUDIT LOG
  // ============================================================

  getAuditLog: adminProcedure
    .input(z.object({
      userId: z.number().optional(),
      severity: z.enum(["low", "medium", "high", "critical"]).optional(),
      actionType: z.string().optional(),
      fromDate: z.string().optional(),
      toDate: z.string().optional(),
      limit: z.number().min(1).max(500).optional().default(50),
      offset: z.number().optional().default(0),
    }))
    .query(async ({ input }) => {
      const filters: any = {};
      if (input.userId) filters.userId = input.userId;
      if (input.severity) filters.severity = input.severity;
      if (input.actionType) filters.actionType = input.actionType;
      if (input.fromDate) filters.fromDate = new Date(input.fromDate);
      if (input.toDate) filters.toDate = new Date(input.toDate);
      filters.limit = input.limit;
      filters.offset = input.offset;
      return await getAuditEntries(filters);
    }),

  getAuditStats: adminProcedure
    .input(z.object({ days: z.number().optional().default(30) }))
    .query(async ({ input }) => {
      return await getAuditStats(input.days);
    }),

  // ============================================================
  // SECURITY EVENTS
  // ============================================================

  getSecurityEvents: adminProcedure
    .input(z.object({
      severity: z.enum(["low", "medium", "high", "critical"]).optional(),
      resolved: z.boolean().optional(),
      source: z.string().optional(),
      limit: z.number().min(1).max(100).optional().default(50),
    }))
    .query(async ({ input }) => {
      const filters: any = {};
      if (input.severity) filters.severity = input.severity;
      if (input.resolved !== undefined) filters.resolved = input.resolved;
      if (input.source) filters.source = input.source;
      filters.limit = input.limit;
      return await getSecurityEvents(filters);
    }),

  getSecurityStats: adminProcedure.query(async () => {
    return await getSecurityStats();
  }),

  resolveSecurityEvent: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await resolveSecurityEvent(input.id, ctx.user!.id);
      await createAuditEntry({
        userId: ctx.user!.id,
        actionType: "security_event_resolved",
        description: `Resolved security event #${input.id}`,
        severity: "low",
        entityType: "security_event",
      });
      return { success: true };
    }),

  // ============================================================
  // FAILED LOGIN ATTEMPTS
  // ============================================================

  getFailedLoginStats: adminProcedure
    .input(z.object({ hours: z.number().optional().default(24) }))
    .query(async ({ input }) => {
      return await getFailedLoginStats(input.hours);
    }),

  // ============================================================
  // EXPORT
  // ============================================================

  exportAuditLog: adminProcedure
    .input(z.object({
      format: z.enum(["json", "csv"]).default("json"),
      severity: z.enum(["low", "medium", "high", "critical"]).optional(),
      fromDate: z.string().optional(),
      toDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const filters: any = { limit: 10000 };
      if (input.severity) filters.severity = input.severity;
      if (input.fromDate) filters.fromDate = new Date(input.fromDate);
      if (input.toDate) filters.toDate = new Date(input.toDate);

      const entries = await getAuditEntries(filters);

      if (input.format === "csv") {
        const headers = ["ID", "UserID", "ActionType", "Description", "Severity", "EntityType", "EntityID", "Timestamp"];
        const rows = entries.map(e => [
          e.id, e.userId ?? "", e.actionType, e.description ?? "", e.severity, e.entityType ?? "", e.entityId ?? "", e.timestamp,
        ]);
        const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
        return { format: "csv", content: csv };
      }

      return { format: "json", content: JSON.stringify(entries, null, 2) };
    }),

  exportSecurityEvents: adminProcedure
    .input(z.object({
      format: z.enum(["json", "csv"]).default("json"),
      resolved: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      const events = await getSecurityEvents({
        resolved: input.resolved,
        limit: 10000,
      });

      if (input.format === "csv") {
        const headers = ["ID", "EventType", "Severity", "Description", "Source", "Resolved", "CreatedAt"];
        const rows = events.map(e => [
          e.id, e.eventType, e.severity, e.description, e.source ?? "", e.resolved, e.createdAt,
        ]);
        const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
        return { format: "csv", content: csv };
      }

      return { format: "json", content: JSON.stringify(events, null, 2) };
    }),

  exportPaymentTransactions: adminProcedure
    .input(z.object({
      format: z.enum(["json", "csv"]).default("json"),
      userId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const transactions = await db.select().from(paymentTransactions)
        .where(input.userId ? eq(paymentTransactions.userId, input.userId) : undefined)
        .limit(10000)
        .orderBy(desc(paymentTransactions.createdAt));

      if (input.format === "csv") {
        const headers = ["ID", "UserID", "Provider", "Type", "Amount", "Currency", "Status", "ProviderID", "CreatedAt"];
        const rows = transactions.map(t => [
          t.id, t.userId, t.provider, t.transactionType, t.amount, t.currency, t.status, t.providerId, t.createdAt,
        ]);
        const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
        return { format: "csv", content: csv };
      }

      return { format: "json", content: JSON.stringify(transactions, null, 2) };
    }),

  exportFullReport: adminProcedure
    .input(z.object({
      days: z.number().optional().default(30),
    }))
    .query(async ({ input }) => {
      const [auditStats, securityStats, failedLoginStats] = await Promise.all([
        getAuditStats(input.days),
        getSecurityStats(),
        getFailedLoginStats(input.days * 24),
      ]);

      return {
        generatedAt: new Date().toISOString(),
        periodDays: input.days,
        auditStats,
        securityStats,
        failedLoginStats,
      };
    }),
});
