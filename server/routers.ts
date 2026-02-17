import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";

/**
 * Agent Router
 */
const agentRouter = router({
  list: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return await db.listAgents(input.userId);
    }),

  get: publicProcedure
    .input(z.object({ agentId: z.string() }))
    .query(async ({ input }) => {
      return await db.getAgent(input.agentId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        type: z.enum(["reasoning", "execution", "analysis", "coordination"]),
        description: z.string().optional(),
        capabilities: z.array(z.string()).optional(),
        llmModel: z.string().optional(),
        parameters: z.record(z.string(), z.any()).optional(),
        integrationFramework: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await db.createAgent({
        userId: ctx.user!.id,
        ...input,
      });
    }),

  updateStatus: protectedProcedure
    .input(z.object({ agentId: z.string(), status: z.string() }))
    .mutation(async ({ input }) => {
      await db.updateAgentStatus(input.agentId, input.status);
      return { success: true };
    }),
});

/**
 * Workflow Router
 */
const workflowRouter = router({
  list: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return await db.listWorkflows(input.userId);
    }),

  get: publicProcedure
    .input(z.object({ workflowId: z.string() }))
    .query(async ({ input }) => {
      return await db.getWorkflow(input.workflowId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        orchestrationPattern: z.enum([
          "sequential",
          "concurrent",
          "hierarchical",
          "round-robin",
          "custom",
        ]),
        description: z.string().optional(),
        nodes: z.array(z.record(z.string(), z.any())).optional(),
        edges: z.array(z.record(z.string(), z.any())).optional(),
        configuration: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await db.createWorkflow({
        userId: ctx.user!.id,
        ...input,
      });
    }),

  updateStatus: protectedProcedure
    .input(z.object({ workflowId: z.string(), status: z.string() }))
    .mutation(async ({ input }) => {
      await db.updateWorkflowStatus(input.workflowId, input.status);
      return { success: true };
    }),
});

/**
 * Task Router
 */
const taskRouter = router({
  list: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        workflowId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return await db.listTasks(input.userId, input.workflowId);
    }),

  get: publicProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ input }) => {
      return await db.getTask(input.taskId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        input: z.record(z.string(), z.any()).optional(),
        assignedAgents: z.array(z.string()).optional(),
        priority: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await db.createTask({
        userId: ctx.user!.id,
        ...input,
      });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        status: z.string(),
        result: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      await db.updateTaskStatus(input.taskId, input.status, input.result);
      return { success: true };
    }),
});

/**
 * Message Router
 */
const messageRouter = router({
  list: publicProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ input }) => {
      return await db.getTaskMessages(input.taskId);
    }),

  send: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        recipientId: z.string().optional(),
        messageType: z.enum([
          "request",
          "response",
          "status",
          "error",
          "result",
        ]),
        content: z.record(z.string(), z.any()).optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const agent = await db.listAgents(ctx.user!.id);
      const senderId = agent.length > 0 ? agent[0]!.id : "system";

      return await db.createMessage({
        userId: ctx.user!.id,
        taskId: input.taskId,
        senderId,
        recipientId: input.recipientId,
        messageType: input.messageType,
        content: input.content,
        metadata: input.metadata,
      });
    }),
});

/**
 * Execution Log Router
 */
const logRouter = router({
  list: publicProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ input }) => {
      return await db.getTaskLogs(input.taskId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        agentId: z.string().optional(),
        eventType: z.enum([
          "error",
          "execution",
          "decision",
          "metric",
          "state_change",
        ]),
        level: z.enum(["error", "debug", "info", "warning", "critical"]),
        message: z.string(),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await db.createExecutionLog({
        userId: ctx.user!.id,
        ...input,
      });
    }),
});

/**
 * Metrics Router
 */
const metricsRouter = router({
  record: protectedProcedure
    .input(
      z.object({
        agentId: z.string(),
        taskId: z.string().optional(),
        executionTime: z.number().optional(),
        tokenUsage: z.number().optional(),
        estimatedCost: z.number().optional(),
        successFlag: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await db.recordMetric({
        userId: ctx.user!.id,
        ...input,
      });
    }),

  getAgentMetrics: publicProcedure
    .input(z.object({ agentId: z.string() }))
    .query(async ({ input }) => {
      return await db.getAgentMetrics(input.agentId);
    }),
});

/**
 * Alerts Router
 */
const alertsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        alertType: z.enum([
          "agent_failure",
          "task_timeout",
          "system_error",
          "task_completion",
          "performance_degradation",
        ]),
        severity: z.enum(["info", "warning", "critical"]).optional(),
        title: z.string(),
        message: z.string().optional(),
        relatedAgentId: z.string().optional(),
        relatedTaskId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await db.createAlert({
        userId: ctx.user!.id,
        ...input,
      });
    }),

  getUnresolved: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return await db.getUnresolvedAlerts(input.userId);
    }),

  resolve: protectedProcedure
    .input(z.object({ alertId: z.string() }))
    .mutation(async ({ input }) => {
      await db.resolveAlert(input.alertId);
      return { success: true };
    }),
});

/**
 * Integration Router
 */
const integrationRouter = router({
  list: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        active: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      return await db.listIntegrations(input.userId, input.active);
    }),

  get: publicProcedure
    .input(z.object({ userId: z.number(), framework: z.string() }))
    .query(async ({ input }) => {
      return await db.getIntegration(input.userId, input.framework);
    }),
});

/**
 * LLM Provider Router
 */
const llmRouter = router({
  list: publicProcedure
    .input(z.object({ userId: z.number(), active: z.boolean().optional() }))
    .query(async ({ input }) => {
      return await db.listLLMProviders(input.userId, input.active);
    }),

  getDefault: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return await db.getDefaultLLMProvider(input.userId);
    }),
});

/**
 * Execution History Router
 */
const historyRouter = router({
  list: publicProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ input }) => {
      return await db.getTaskHistory(input.taskId);
    }),

  save: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        workflowId: z.string(),
        input: z.record(z.string(), z.any()).optional(),
        output: z.record(z.string(), z.any()).optional(),
        conversationLog: z.array(z.any()).optional(),
        metrics: z.record(z.string(), z.any()).optional(),
        executionTime: z.number(),
        status: z.enum(["pending", "running", "completed", "failed"]),
        storageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await db.saveExecutionHistory({
        userId: ctx.user!.id,
        ...input,
      });
    }),
});

/**
 * Consensus Router
 */
const consensusRouter = router({
  save: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        consensusType: z.enum(["voting", "judge-based", "mixture-of-agents"]),
        agentResults: z.array(z.record(z.string(), z.any())).optional(),
        finalResult: z.record(z.string(), z.any()).optional(),
        confidence: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await db.saveConsensusResult({
        userId: ctx.user!.id,
        ...input,
      });
    }),
});

/**
 * Agent Configuration Router
 */
const configRouter = router({
  save: protectedProcedure
    .input(
      z.object({
        agentId: z.string(),
        workflowId: z.string().optional(),
        parameters: z.record(z.string(), z.any()).optional(),
        llmModel: z.string().optional(),
        systemPrompt: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await db.saveAgentConfiguration({
        userId: ctx.user!.id,
        ...input,
      });
    }),

  get: publicProcedure
    .input(z.object({ agentId: z.string(), workflowId: z.string().optional() }))
    .query(async ({ input }) => {
      return await db.getAgentConfiguration(input.agentId, input.workflowId);
    }),
});

/**
 * Main App Router
 */
export const appRouter = router({
  agents: agentRouter,
  workflows: workflowRouter,
  tasks: taskRouter,
  messages: messageRouter,
  logs: logRouter,
  metrics: metricsRouter,
  alerts: alertsRouter,
  integrations: integrationRouter,
  llm: llmRouter,
  history: historyRouter,
  consensus: consensusRouter,
  config: configRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      return {
        success: true,
      } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
