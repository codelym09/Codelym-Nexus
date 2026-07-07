import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Raw logs uploaded by users for processing
 */
export const rawLogs = mysqlTable("raw_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  content: text("content").notNull(),
  source: varchar("source", { length: 255 }).notNull(), // "file_upload" or "paste"
  fileName: varchar("file_name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type RawLog = typeof rawLogs.$inferSelect;
export type InsertRawLog = typeof rawLogs.$inferInsert;

/**
 * Destilled workflows generated from logs
 */
export const workflows = mysqlTable("workflows", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pendiente", "aprobado", "ejecutando", "completado", "fallido"]).default("pendiente").notNull(),
  graphJson: text("graph_json").notNull(),
  sourceLogId: int("source_log_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  approvedAt: timestamp("approved_at"),
  approvedBy: int("approved_by"),
});

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;

/**
 * Individual steps within a workflow
 */
export const workflowSteps = mysqlTable("workflow_steps", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflow_id").notNull(),
  stepNumber: int("step_number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  action: varchar("action", { length: 255 }).notNull(),
  parameters: text("parameters"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WorkflowStep = typeof workflowSteps.$inferSelect;
export type InsertWorkflowStep = typeof workflowSteps.$inferInsert;

/**
 * Workflow history for tracking changes and expansions
 */
export const workflowHistory = mysqlTable("workflow_history", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflow_id").notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  previousState: text("previous_state"),
  newState: text("new_state"),
  changedBy: int("changed_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WorkflowHistoryEntry = typeof workflowHistory.$inferSelect;
export type InsertWorkflowHistoryEntry = typeof workflowHistory.$inferInsert;

// ============================================================
// SECURITY & AUDIT TABLES
// ============================================================

/**
 * Security audit log - tracks all sensitive actions in the system
 */
export const securityAuditLog = mysqlTable("security_audit_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id"), // null for system events
  actionType: varchar("action_type", { length: 100 }).notNull(),
  description: text("description"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: varchar("user_agent", { length: 512 }),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("low").notNull(),
  entityType: varchar("entity_type", { length: 100 }), // "workflow", "user", "payment", "log"
  entityId: int("entity_id"),
  resourcePath: varchar("resource_path", { length: 512 }),
  metadata: text("metadata"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type SecurityAuditEntry = typeof securityAuditLog.$inferSelect;
export type InsertSecurityAuditEntry = typeof securityAuditLog.$inferInsert;

/**
 * Failed login attempts tracking
 */
export const failedLoginAttempts = mysqlTable("failed_login_attempts", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }),
  email: varchar("email", { length: 320 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: varchar("user_agent", { length: 512 }),
  reason: varchar("reason", { length: 255 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type FailedLoginAttempt = typeof failedLoginAttempts.$inferSelect;
export type InsertFailedLoginAttempt = typeof failedLoginAttempts.$inferInsert;

/**
 * Security events - critical security incidents
 */
export const securityEvents = mysqlTable("security_events", {
  id: int("id").autoincrement().primaryKey(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  description: text("description").notNull(),
  source: varchar("source", { length: 100 }), // "auth", "payment", "api", "system"
  affectedUserId: int("affected_user_id"),
  metadata: text("metadata"),
  resolved: boolean("resolved").default(false).notNull(),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: int("resolved_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SecurityEvent = typeof securityEvents.$inferSelect;
export type InsertSecurityEvent = typeof securityEvents.$inferInsert;

// ============================================================
// BILLING & PAYMENT TABLES
// ============================================================

/**
 * Subscription plans available in the system
 */
export const subscriptionPlans = mysqlTable("subscription_plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  billingInterval: mysqlEnum("billing_interval", ["monthly", "yearly"]).default("monthly").notNull(),
  features: text("features"), // JSON array of features
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
  mercadoPagoPriceId: varchar("mercado_pago_price_id", { length: 255 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

/**
 * User subscriptions
 */
export const userSubscriptions = mysqlTable("user_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  planId: int("plan_id").notNull(),
  status: mysqlEnum("status", ["trialing", "active", "past_due", "canceled", "incomplete", "incomplete_expired", "paused"]).default("trialing").notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  mercadoPagoSubscriptionId: varchar("mercado_pago_subscription_id", { length: 255 }),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  canceledAt: timestamp("canceled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;

/**
 * Payment transactions
 */
export const paymentTransactions = mysqlTable("payment_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  subscriptionId: int("subscription_id"),
  provider: mysqlEnum("provider", ["stripe", "mercado_pago"]).notNull(),
  transactionType: mysqlEnum("transaction_type", ["payment", "refund", "chargeback", "credit"]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  providerId: varchar("provider_id", { length: 255 }).notNull(), // stripe charge id / mp payment id
  status: mysqlEnum("status", ["pending", "succeeded", "failed", "refunded", "partially_refunded"]).default("pending").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = typeof paymentTransactions.$inferInsert;

/**
 * Webhook event log for tracking delivered webhooks
 */
export const webhookEvents = mysqlTable("webhook_events", {
  id: int("id").autoincrement().primaryKey(),
  provider: mysqlEnum("provider", ["stripe", "mercado_pago"]).notNull(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  providerEventId: varchar("provider_event_id", { length: 255 }).notNull().unique(),
  payload: text("payload"),
  processed: boolean("processed").default(false).notNull(),
  processingResult: text("processing_result"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = typeof webhookEvents.$inferInsert;
