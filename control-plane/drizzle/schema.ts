import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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

// TODO: Add your tables here

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
