import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { createRawLog, getUserWorkflows, createWorkflow, getWorkflowById, getWorkflowSteps, updateWorkflowStatus, createWorkflowSteps, addWorkflowHistory } from "./db";
import { callLLM } from "./_core/llm";
import { paymentRouter } from "./routers/paymentRouter";
import { securityRouter } from "./routers/securityRouter";
import { webhookRouter } from "./routers/webhookRouter";
import { adminRouter } from "./routers/adminRouter";
import { notificationRouter } from "./routers/notificationRouter";
import { createAuditEntry } from "./audit";

const workflowRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await getUserWorkflows(ctx.user!.id);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const workflow = await getWorkflowById(input.id);
      if (!workflow) throw new Error("Workflow not found");
      const steps = await getWorkflowSteps(input.id);
      return { ...workflow, steps };
    }),

  approve: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const workflow = await getWorkflowById(input.id);
      if (!workflow) throw new Error("Workflow not found");
      if (workflow.userId !== ctx.user!.id) throw new Error("Unauthorized");
      
      await updateWorkflowStatus(input.id, "aprobado");
      await addWorkflowHistory({
        workflowId: input.id,
        action: "approved",
        previousState: JSON.stringify({ status: workflow.status }),
        newState: JSON.stringify({ status: "aprobado" }),
        changedBy: ctx.user!.id,
      });

      // Audit entry
      await createAuditEntry({
        userId: ctx.user!.id,
        actionType: "workflow_approved",
        description: `Approved workflow #${input.id}: ${workflow.name}`,
        severity: "medium",
        entityType: "workflow",
        entityId: input.id,
      });
      
      return { success: true };
    }),

  reject: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const workflow = await getWorkflowById(input.id);
      if (!workflow) throw new Error("Workflow not found");
      if (workflow.userId !== ctx.user!.id) throw new Error("Unauthorized");
      
      await updateWorkflowStatus(input.id, "fallido");
      await addWorkflowHistory({
        workflowId: input.id,
        action: "rejected",
        previousState: JSON.stringify({ status: workflow.status }),
        newState: JSON.stringify({ status: "fallido" }),
        changedBy: ctx.user!.id,
      });

      // Audit entry
      await createAuditEntry({
        userId: ctx.user!.id,
        actionType: "workflow_rejected",
        description: `Rejected workflow #${input.id}: ${workflow.name}`,
        severity: "medium",
        entityType: "workflow",
        entityId: input.id,
      });
      
      return { success: true };
    }),
});

const logsRouter = router({
  uploadPaste: protectedProcedure
    .input(z.object({ content: z.string(), fileName: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const logId = await createRawLog({
        userId: ctx.user!.id,
        content: input.content,
        source: "paste",
        fileName: input.fileName,
      });

      const distilledWorkflow = await callLLM(input.content);
      
      const workflowId = await createWorkflow({
        userId: ctx.user!.id,
        name: distilledWorkflow.name || "Workflow Destilado",
        description: distilledWorkflow.description,
        graphJson: JSON.stringify(distilledWorkflow.graph),
        sourceLogId: logId,
        status: "pendiente",
      });

      if (distilledWorkflow.steps && distilledWorkflow.steps.length > 0) {
        const stepsToCreate = distilledWorkflow.steps.map((step: any, idx: number) => ({
          workflowId,
          stepNumber: idx + 1,
          title: step.title,
          description: step.description,
          action: step.action,
          parameters: JSON.stringify(step.parameters || {}),
        }));
        await createWorkflowSteps(stepsToCreate);
      }

      await addWorkflowHistory({
        workflowId,
        action: "created",
        newState: JSON.stringify({ status: "pendiente" }),
        changedBy: ctx.user!.id,
      });

      // Audit entry
      await createAuditEntry({
        userId: ctx.user!.id,
        actionType: "log_ingested",
        description: `Ingested log and created workflow #${workflowId}`,
        severity: "low",
        entityType: "log",
        entityId: logId,
      });

      return { workflowId, logId };
    }),
});

// Auth router with audit logging
const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    
    // Audit logout
    if (ctx.user) {
      createAuditEntry({
        userId: ctx.user.id,
        actionType: "user_logout",
        description: `User ${ctx.user.email} logged out`,
        severity: "low",
        entityType: "user",
        entityId: ctx.user.id,
      }).catch(() => {}); // Don't block logout on audit failure
    }
    
    return { success: true } as const;
  }),
});

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  workflows: workflowRouter,
  logs: logsRouter,
  payments: paymentRouter,
  security: securityRouter,
  webhooks: webhookRouter,
  admin: adminRouter,
  notifications: notificationRouter,
});

export type AppRouter = typeof appRouter;
