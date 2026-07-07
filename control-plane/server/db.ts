import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.

import { workflows, workflowSteps, rawLogs, workflowHistory } from "../drizzle/schema";
import type { InsertWorkflow, InsertWorkflowStep, InsertRawLog, InsertWorkflowHistoryEntry } from "../drizzle/schema";

export async function createRawLog(log: InsertRawLog): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(rawLogs).values(log);
  return (result as any).insertId as number;
}

export async function getRawLogById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(rawLogs).where(eq(rawLogs.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createWorkflow(workflow: InsertWorkflow): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(workflows).values(workflow);
  return (result as any).insertId as number;
}

export async function getWorkflowById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(workflows).where(eq(workflows.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserWorkflows(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(workflows).where(eq(workflows.userId, userId));
}

export async function updateWorkflowStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(workflows).set({ status: status as any }).where(eq(workflows.id, id));
}

export async function createWorkflowSteps(steps: InsertWorkflowStep[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (steps.length === 0) return;
  await db.insert(workflowSteps).values(steps);
}

export async function getWorkflowSteps(workflowId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(workflowSteps).where(eq(workflowSteps.workflowId, workflowId));
}

export async function addWorkflowHistory(entry: InsertWorkflowHistoryEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(workflowHistory).values(entry);
}
