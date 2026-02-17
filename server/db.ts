import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, agents, workflows, tasks, agentMessages, executionLogs, orchestrationConfigs, workflowTemplates, agentMetrics, systemAlerts, integrationModules, llmProviders } from "../drizzle/schema";
import { ENV } from './_core/env';
import { nanoid } from 'nanoid';

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

// ============================================================================
// USER OPERATIONS
// ============================================================================

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

// ============================================================================
// AGENT REGISTRY OPERATIONS
// ============================================================================

export async function createAgent(agentData: {
  name: string;
  type: "reasoning" | "execution" | "coordination" | "analysis";
  description?: string;
  capabilities?: string[];
  llmModel?: string;
  parameters?: Record<string, unknown>;
  integrationFramework?: string;
  version?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = nanoid(36);
  const now = new Date();

  try {
    await db.insert(agents).values({
      id,
      name: agentData.name,
      type: agentData.type,
      description: agentData.description,
      capabilities: agentData.capabilities || [],
      llmModel: agentData.llmModel,
      parameters: agentData.parameters,
      integrationFramework: agentData.integrationFramework,
      version: agentData.version || "1.0.0",
      status: "active",
      healthScore: 100,
      successRate: 100,
      totalExecutions: 0,
      failedExecutions: 0,
      createdAt: now,
      updatedAt: now,
    });
    return { id, ...agentData };
  } catch (error) {
    console.error("[Database] Failed to create agent:", error);
    throw error;
  }
}

export async function getAgent(agentId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listAgents(filters?: { status?: string; type?: string }) {
  const db = await getDb();
  if (!db) return [];

  if (filters?.status) {
    return await db.select().from(agents).where(eq(agents.status, filters.status as any));
  }
  if (filters?.type) {
    return await db.select().from(agents).where(eq(agents.type, filters.type as any));
  }

  return await db.select().from(agents);
}

export async function updateAgentStatus(agentId: string, status: "active" | "inactive" | "error" | "maintenance") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.update(agents)
      .set({ status, updatedAt: new Date() })
      .where(eq(agents.id, agentId));
  } catch (error) {
    console.error("[Database] Failed to update agent status:", error);
    throw error;
  }
}

export async function updateAgentMetrics(agentId: string, metrics: { successCount?: number; failureCount?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const agent = await getAgent(agentId);
  if (!agent) throw new Error("Agent not found");

  const totalExecutions = (agent.totalExecutions || 0) + (metrics.successCount || 0) + (metrics.failureCount || 0);
  const failedExecutions = (agent.failedExecutions || 0) + (metrics.failureCount || 0);
  const successRate = totalExecutions > 0 ? ((totalExecutions - failedExecutions) / totalExecutions) * 100 : 100;
  const healthScore = Math.max(0, Math.min(100, successRate));

  try {
    await db.update(agents)
      .set({
        totalExecutions,
        failedExecutions,
        successRate,
        healthScore,
        updatedAt: new Date(),
      })
      .where(eq(agents.id, agentId));
  } catch (error) {
    console.error("[Database] Failed to update agent metrics:", error);
    throw error;
  }
}

// ============================================================================
// WORKFLOW OPERATIONS
// ============================================================================

export async function createWorkflow(workflowData: {
  name: string;
  description?: string;
  orchestrationPattern: "hierarchical" | "sequential" | "concurrent" | "round_robin" | "mesh";
  nodes?: Array<Record<string, unknown>>;
  edges?: Array<Record<string, unknown>>;
  configuration?: Record<string, unknown>;
  templateId?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = nanoid(36);
  const now = new Date();

  try {
    await db.insert(workflows).values({
      id,
      name: workflowData.name,
      description: workflowData.description,
      orchestrationPattern: workflowData.orchestrationPattern,
      nodes: workflowData.nodes,
      edges: workflowData.edges,
      configuration: workflowData.configuration,
      status: "draft",
      templateId: workflowData.templateId,
      createdAt: now,
      updatedAt: now,
    });
    return { id, ...workflowData };
  } catch (error) {
    console.error("[Database] Failed to create workflow:", error);
    throw error;
  }
}

export async function getWorkflow(workflowId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(workflows).where(eq(workflows.id, workflowId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listWorkflows(filters?: { status?: string }) {
  const db = await getDb();
  if (!db) return [];

  if (filters?.status) {
    return await db.select().from(workflows).where(eq(workflows.status, filters.status as any));
  }

  return await db.select().from(workflows);
}

export async function updateWorkflowStatus(workflowId: string, status: "draft" | "active" | "paused" | "archived") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.update(workflows)
      .set({ status, updatedAt: new Date() })
      .where(eq(workflows.id, workflowId));
  } catch (error) {
    console.error("[Database] Failed to update workflow status:", error);
    throw error;
  }
}

// ============================================================================
// TASK OPERATIONS
// ============================================================================

export async function createTask(taskData: {
  workflowId: string;
  input?: Record<string, unknown>;
  assignedAgents?: string[];
  priority?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = nanoid(36);
  const now = new Date();

  try {
    await db.insert(tasks).values({
      id,
      workflowId: taskData.workflowId,
      input: taskData.input,
      assignedAgents: taskData.assignedAgents,
      priority: taskData.priority || 5,
      status: "pending",
      consensusMethod: "none",
      createdAt: now,
      retryCount: 0,
    });
    return { id, ...taskData };
  } catch (error) {
    console.error("[Database] Failed to create task:", error);
    throw error;
  }
}

export async function getTask(taskId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateTaskStatus(taskId: string, status: "pending" | "running" | "completed" | "failed" | "timeout", result?: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const updates: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === "running") {
      updates.startedAt = new Date();
    } else if (["completed", "failed", "timeout"].includes(status)) {
      updates.completedAt = new Date();
    }

    if (result) {
      updates.result = result;
    }

    await db.update(tasks)
      .set(updates)
      .where(eq(tasks.id, taskId));
  } catch (error) {
    console.error("[Database] Failed to update task status:", error);
    throw error;
  }
}

// ============================================================================
// MESSAGE OPERATIONS
// ============================================================================

export async function createMessage(messageData: {
  senderId: string;
  recipientId?: string;
  taskId?: string;
  messageType: "request" | "response" | "status_update" | "error" | "broadcast";
  content: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = nanoid(36);

  try {
    await db.insert(agentMessages).values({
      id,
      senderId: messageData.senderId,
      recipientId: messageData.recipientId,
      taskId: messageData.taskId,
      messageType: messageData.messageType,
      content: messageData.content,
      timestamp: new Date(),
      deliveryStatus: "pending",
      metadata: messageData.metadata,
    });
    return { id, ...messageData };
  } catch (error) {
    console.error("[Database] Failed to create message:", error);
    throw error;
  }
}

export async function getConversationHistory(taskId: string, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select()
    .from(agentMessages)
    .where(eq(agentMessages.taskId, taskId))
    .limit(limit);

  return result;
}

// ============================================================================
// EXECUTION LOG OPERATIONS
// ============================================================================

export async function createExecutionLog(logData: {
  taskId: string;
  agentId: string;
  eventType: "execution" | "decision" | "error" | "metric" | "state_change";
  level?: "debug" | "info" | "warning" | "error" | "critical";
  message?: string;
  metadata?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = nanoid(36);

  try {
    await db.insert(executionLogs).values({
      id,
      taskId: logData.taskId,
      agentId: logData.agentId,
      eventType: logData.eventType,
      level: logData.level || "info",
      message: logData.message,
      metadata: logData.metadata,
      timestamp: new Date(),
    });
    return { id, ...logData };
  } catch (error) {
    console.error("[Database] Failed to create execution log:", error);
    throw error;
  }
}

export async function getTaskLogs(taskId: string, limit: number = 1000) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select()
    .from(executionLogs)
    .where(eq(executionLogs.taskId, taskId))
    .limit(limit);

  return result;
}

// ============================================================================
// ALERT OPERATIONS
// ============================================================================

export async function createAlert(alertData: {
  alertType: "agent_failure" | "task_timeout" | "system_error" | "task_completion" | "performance_degradation";
  severity?: "info" | "warning" | "critical";
  title: string;
  message?: string;
  relatedAgentId?: string;
  relatedTaskId?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = nanoid(36);

  try {
    await db.insert(systemAlerts).values({
      id,
      alertType: alertData.alertType,
      severity: alertData.severity || "info",
      title: alertData.title,
      message: alertData.message,
      relatedAgentId: alertData.relatedAgentId,
      relatedTaskId: alertData.relatedTaskId,
      isResolved: false,
      createdAt: new Date(),
    });
    return { id, ...alertData };
  } catch (error) {
    console.error("[Database] Failed to create alert:", error);
    throw error;
  }
}

export async function getUnresolvedAlerts() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select()
    .from(systemAlerts)
    .where(eq(systemAlerts.isResolved, false));

  return result;
}

// ============================================================================
// METRICS OPERATIONS
// ============================================================================

export async function recordMetric(metricData: {
  agentId: string;
  taskId?: string;
  executionTime?: number;
  tokenUsage?: number;
  estimatedCost?: number;
  successFlag?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = nanoid(36);

  try {
    await db.insert(agentMetrics).values({
      id,
      agentId: metricData.agentId,
      taskId: metricData.taskId,
      executionTime: metricData.executionTime,
      tokenUsage: metricData.tokenUsage,
      estimatedCost: metricData.estimatedCost,
      successFlag: metricData.successFlag,
      timestamp: new Date(),
    });
    return { id, ...metricData };
  } catch (error) {
    console.error("[Database] Failed to record metric:", error);
    throw error;
  }
}

export async function getAgentMetrics(agentId: string, hoursBack: number = 24) {
  const db = await getDb();
  if (!db) return [];

  const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  const result = await db.select()
    .from(agentMetrics)
    .where(eq(agentMetrics.agentId, agentId));

  return result.filter(m => m.timestamp && m.timestamp > cutoffTime);
}

// ============================================================================
// TEMPLATE OPERATIONS
// ============================================================================

export async function getWorkflowTemplates(category?: string) {
  const db = await getDb();
  if (!db) return [];

  if (category) {
    return await db.select().from(workflowTemplates).where(eq(workflowTemplates.category, category as any));
  }

  return await db.select().from(workflowTemplates);
}

export async function getTemplate(templateId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select()
    .from(workflowTemplates)
    .where(eq(workflowTemplates.id, templateId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// INTEGRATION OPERATIONS
// ============================================================================

export async function listIntegrations(active?: boolean) {
  const db = await getDb();
  if (!db) return [];

  if (active !== undefined) {
    return await db.select().from(integrationModules).where(eq(integrationModules.isActive, active));
  }

  return await db.select().from(integrationModules);
}

export async function getIntegration(framework: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select()
    .from(integrationModules)
    .where(eq(integrationModules.framework, framework))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// LLM PROVIDER OPERATIONS
// ============================================================================

export async function listLLMProviders(active?: boolean) {
  const db = await getDb();
  if (!db) return [];

  if (active !== undefined) {
    return await db.select().from(llmProviders).where(eq(llmProviders.isActive, active));
  }

  return await db.select().from(llmProviders);
}

export async function getDefaultLLMProvider() {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select()
    .from(llmProviders)
    .where(eq(llmProviders.isDefault, true))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}
