import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleStripeWebhook, handleMercadoPagoWebhook } from "../webhooks";
import { sdk } from "./sdk";
import { ForbiddenError } from "@shared/_core/errors";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function authenticateAdmin(req: express.Request) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }
    return user;
  } catch (err) {
    throw new Error("Authentication failed: " + (err instanceof Error ? err.message : String(err)));
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // ============================================================
  // WEBHOOK ENDPOINTS
  // ============================================================
  app.post("/api/webhooks/stripe", handleStripeWebhook);
  app.post("/api/webhooks/mercado_pago", handleMercadoPagoWebhook);

  // ============================================================
  // EXPORT ENDPOINTS (protected by auth)
  // ============================================================
  app.get("/api/export/audit", async (req, res) => {
    try {
      await authenticateAdmin(req);

      const format = (req.query.format as string) || "json";
      const severity = req.query.severity as string;
      const fromDate = req.query.fromDate as string;
      const toDate = req.query.toDate as string;

      const { getAuditEntries } = await import("../audit");
      const filters: any = { limit: 10000 };
      if (severity) filters.severity = severity;
      if (fromDate) filters.fromDate = new Date(fromDate);
      if (toDate) filters.toDate = new Date(toDate);

      const entries = await getAuditEntries(filters);

      if (format === "csv") {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", 'attachment; filename="audit_log.csv"');
        const headers = ["ID", "UserID", "ActionType", "Description", "Severity", "EntityType", "EntityID", "Timestamp"];
        const rows = entries.map(e => [
          e.id, e.userId ?? "", e.actionType, e.description ?? "", e.severity, e.entityType ?? "", e.entityId ?? "", e.timestamp,
        ]);
        res.send([headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n"));
      } else {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", 'attachment; filename="audit_log.json"');
        res.send(JSON.stringify(entries, null, 2));
      }
    } catch (error) {
      console.error("[Export] Audit error:", error);
      res.status(403).json({ error: "Admin access required" });
    }
  });

  app.get("/api/export/security-events", async (req, res) => {
    try {
      await authenticateAdmin(req);

      const format = (req.query.format as string) || "json";
      const resolved = req.query.resolved === "true";

      const { getSecurityEvents } = await import("../audit");
      const events = await getSecurityEvents({ resolved, limit: 10000 });

      if (format === "csv") {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", 'attachment; filename="security_events.csv"');
        const headers = ["ID", "EventType", "Severity", "Description", "Source", "Resolved", "CreatedAt"];
        const rows = events.map(e => [
          e.id, e.eventType, e.severity, e.description, e.source ?? "", e.resolved, e.createdAt,
        ]);
        res.send([headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n"));
      } else {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", 'attachment; filename="security_events.json"');
        res.send(JSON.stringify(events, null, 2));
      }
    } catch (error) {
      console.error("[Export] Security events error:", error);
      res.status(403).json({ error: "Admin access required" });
    }
  });

  app.get("/api/export/payments", async (req, res) => {
    try {
      await authenticateAdmin(req);

      const format = (req.query.format as string) || "json";
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;

      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const { desc, eq } = await import("drizzle-orm");
      const { paymentTransactions } = await import("../../drizzle/schema");

      const transactions = await db.select().from(paymentTransactions)
        .where(userId ? eq(paymentTransactions.userId, userId) : undefined)
        .limit(10000)
        .orderBy(desc(paymentTransactions.createdAt));

      if (format === "csv") {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", 'attachment; filename="payment_transactions.csv"');
        const headers = ["ID", "UserID", "Provider", "Type", "Amount", "Currency", "Status", "ProviderID", "CreatedAt"];
        const rows = transactions.map(t => [
          t.id, t.userId, t.provider, t.transactionType, t.amount, t.currency, t.status, t.providerId, t.createdAt,
        ]);
        res.send([headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n"));
      } else {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", 'attachment; filename="payment_transactions.json"');
        res.send(JSON.stringify(transactions, null, 2));
      }
    } catch (error) {
      console.error("[Export] Payments error:", error);
      res.status(403).json({ error: "Admin access required" });
    }
  });

  app.get("/api/export/full-report", async (req, res) => {
    try {
      await authenticateAdmin(req);

      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const { getAuditStats, getSecurityStats, getFailedLoginStats } = await import("../audit");

      const [auditStats, securityStats, failedLoginStats] = await Promise.all([
        getAuditStats(days),
        getSecurityStats(),
        getFailedLoginStats(days * 24),
      ]);

      const report = {
        generatedAt: new Date().toISOString(),
        periodDays: days,
        auditStats,
        securityStats,
        failedLoginStats,
      };

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="security_report_${days}days.json"`);
      res.send(JSON.stringify(report, null, 2));
    } catch (error) {
      console.error("[Export] Full report error:", error);
      res.status(403).json({ error: "Admin access required" });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`Webhooks: http://localhost:${port}/api/webhooks/stripe`);
    console.log(`          http://localhost:${port}/api/webhooks/mercado_pago`);
    console.log(`Exports: http://localhost:${port}/api/export/*`);
  });
}

startServer().catch(console.error);
