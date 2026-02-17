import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

const anyObject = z.object({}).passthrough();

/**
 * Agent Management Router
 */
const agentRouter = router({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      type: z.enum(["reasoning", "execution", "coordination", "analysis"]),
      description: z.string().optional(),
      capabilities: z.array(z.string()).optional(),
      llmModel: z.string().optional(),
      parameters: anyObject.optional(),
      integrationFramework: z.string().optional(),
      version: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await db.createAgent(input);
    }),

  get: publicProcedure
    .input(z.object({ agentId: z.string() }))
    .query(async ({ input }) => {
      return await db.getAgent(input.agentId);
    }),

  list: publicProcedure
    .input(z.object({
      status: z.string().optional(),
      type: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      return await db.listAgents(input);
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      agentId: z.string(),
      status: z.enum(["active", "inactive", "error", "maintenance"]),
    }))
    .mutation(async ({ input }) => {
      await db.updateAgentStatus(input.agentId, input.status);
      return { success: true };
    }),

  updateMetrics: protectedProcedure
    .input(z.object({
      agentId: z.string(),
      successCount: z.number().optional(),
      failureCount: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.updateAgentMetrics(input.agentId, {
        successCount: input.successCount,
        failureCount: input.failureCount,
      });
      return { success: true };
    }),
});

/**
 * Workflow Management Router
 */
const workflowRouter = router({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      orchestrationPattern: z.enum(["hierarchical", "sequential", "concurrent", "round_robin", "mesh"]),
      nodes: z.array(anyObject).optional(),
      edges: z.array(anyObject).optional(),
      configuration: anyObject.optional(),
      templateId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await db.createWorkflow(input);
    }),

  get: publicProcedure
    .input(z.object({ workflowId: z.string() }))
    .query(async ({ input }) => {
      return await db.getWorkflow(input.workflowId);
    }),

  list: publicProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return await db.listWorkflows(input || {});
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      workflowId: z.string(),
      status: z.enum(["draft", "active", "paused", "archived"]),
    }))
    .mutation(async ({ input }) => {
      await db.updateWorkflowStatus(input.workflowId, input.status);
      return { success: true };
    }),

  getTemplates: publicProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return await db.getWorkflowTemplates(input?.category || undefined);
    }),
});

/**
 * Task Execution Router
 */
const taskRouter = router({
  create: protectedProcedure
    .input(z.object({
      workflowId: z.string(),
      input: anyObject.optional(),
      assignedAgents: z.array(z.string()).optional(),
      priority: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      return await db.createTask(input);
    }),

  get: publicProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ input }) => {
      return await db.getTask(input.taskId);
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      taskId: z.string(),
      status: z.enum(["pending", "running", "completed", "failed", "timeout"]),
      result: anyObject.optional(),
    }))
    .mutation(async ({ input }) => {
      await db.updateTaskStatus(input.taskId, input.status, input.result || undefined);
      return { success: true };
    }),

  getLogs: publicProcedure
    .input(z.object({ taskId: z.string(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      return await db.getTaskLogs(input.taskId, input.limit || 1000);
    }),

  getConversation: publicProcedure
    .input(z.object({ taskId: z.string(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      return await db.getConversationHistory(input.taskId, input.limit || 100);
    }),
});

/**
 * Communication Router
 */
const communicationRouter = router({
  sendMessage: protectedProcedure
    .input(z.object({
      senderId: z.string(),
      recipientId: z.string().optional(),
      taskId: z.string().optional(),
      messageType: z.enum(["request", "response", "status_update", "error", "broadcast"]),
      content: anyObject,
      metadata: anyObject.optional(),
    }))
    .mutation(async ({ input }) => {
      return await db.createMessage(input);
    }),

  getConversation: publicProcedure
    .input(z.object({ taskId: z.string(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      return await db.getConversationHistory(input.taskId, input.limit || 100);
    }),
});

/**
 * Monitoring & Observability Router
 */
const monitoringRouter = router({
  recordMetric: protectedProcedure
    .input(z.object({
      agentId: z.string(),
      taskId: z.string().optional(),
      executionTime: z.number().optional(),
      tokenUsage: z.number().optional(),
      estimatedCost: z.number().optional(),
      successFlag: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      return await db.recordMetric(input);
    }),

  getAgentMetrics: publicProcedure
    .input(z.object({ agentId: z.string(), hoursBack: z.number().optional() }))
    .query(async ({ input }) => {
      return await db.getAgentMetrics(input.agentId, input.hoursBack || 24);
    }),

  createLog: protectedProcedure
    .input(z.object({
      taskId: z.string(),
      agentId: z.string(),
      eventType: z.enum(["execution", "decision", "error", "metric", "state_change"]),
      level: z.enum(["debug", "info", "warning", "error", "critical"]).optional(),
      message: z.string().optional(),
      metadata: anyObject.optional(),
    }))
    .mutation(async ({ input }) => {
      return await db.createExecutionLog(input);
    }),

  getTaskLogs: publicProcedure
    .input(z.object({ taskId: z.string(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      return await db.getTaskLogs(input.taskId, input.limit || 1000);
    }),
});

/**
 * Alerts Router
 */
const alertsRouter = router({
  create: protectedProcedure
    .input(z.object({
      alertType: z.enum(["agent_failure", "task_timeout", "system_error", "task_completion", "performance_degradation"]),
      severity: z.enum(["info", "warning", "critical"]).optional(),
      title: z.string(),
      message: z.string().optional(),
      relatedAgentId: z.string().optional(),
      relatedTaskId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await db.createAlert(input);
    }),

  getUnresolved: publicProcedure
    .query(async () => {
      return await db.getUnresolvedAlerts();
    }),
});

/**
 * Integration Router
 */
const integrationRouter = router({
  list: publicProcedure
    .input(z.object({ active: z.boolean().optional() }).optional())
    .query(async ({ input }) => {
      return await db.listIntegrations(input?.active || undefined);
    }),

  get: publicProcedure
    .input(z.object({ framework: z.string() }))
    .query(async ({ input }) => {
      return await db.getIntegration(input.framework);
    }),
});

/**
 * LLM Provider Router
 */
const llmRouter = router({
  list: publicProcedure
    .input(z.object({ active: z.boolean().optional() }).optional())
    .query(async ({ input }) => {
      return await db.listLLMProviders(input?.active || undefined);
    }),

  getDefault: publicProcedure
    .query(async () => {
      return await db.getDefaultLLMProvider();
    }),
});

/**
 * Main App Router
 */
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  agent: agentRouter,
  workflow: workflowRouter,
  task: taskRouter,
  communication: communicationRouter,
  monitoring: monitoringRouter,
  alerts: alertsRouter,
  integration: integrationRouter,
  llm: llmRouter,
});

export type AppRouter = typeof appRouter;
