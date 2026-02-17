import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  swarmAgents,
  workflows,
  tasks,
  messages,
  executionLogs,
  metrics,
  alerts,
  integrations,
  llmProviders,
  workflowTemplates,
  executionHistory,
  consensusResults,
  agentConfigurations,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { nanoid } from "nanoid";

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
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db
      .insert(users)
      .values(values as any)
      .onDuplicateKeyUpdate({
        set: updateSet as any,
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

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// AGENT OPERATIONS
// ============================================================================

export async function createAgent(agentData: {
  userId: number;
  name: string;
  type: string;
  description?: string;
  capabilities?: any;
  llmModel?: string;
  parameters?: any;
  integrationFramework?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = "agent-" + nanoid();

  try {
    await db.insert(swarmAgents).values({
      userId: agentData.userId,
      name: agentData.name,
      type: agentData.type as any,
      description: agentData.description,
      capabilities: JSON.stringify(agentData.capabilities || []),
      llmModel: agentData.llmModel,
      parameters: JSON.stringify(agentData.parameters || {}),
      integrationFramework: agentData.integrationFramework,
      status: "active",
      healthScore: 100,
      successRate: 100,
      totalExecutions: 0,
      failedExecutions: 0,
    } as any);
    return { id, ...agentData };
  } catch (error) {
    console.error("[Database] Failed to create agent:", error);
    throw error;
  }
}

export async function listAgents(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(swarmAgents)
    .where(eq(swarmAgents.userId, userId));
}

export async function getAgent(agentId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(swarmAgents)
    .where(eq(swarmAgents.id, agentId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateAgentStatus(agentId: string, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(swarmAgents)
    .set({ status: status as any })
    .where(eq(swarmAgents.id, agentId));
}

// ============================================================================
// WORKFLOW OPERATIONS
// ============================================================================

export async function createWorkflow(workflowData: {
  userId: number;
  name: string;
  description?: string;
  orchestrationPattern: string;
  nodes?: any;
  edges?: any;
  configuration?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = "workflow-" + nanoid();

  try {
    await db.insert(workflows).values({
      id,
      userId: workflowData.userId,
      name: workflowData.name,
      description: workflowData.description,
      orchestrationPattern: workflowData.orchestrationPattern as any,
      nodes: JSON.stringify(workflowData.nodes || []),
      edges: JSON.stringify(workflowData.edges || []),
      configuration: JSON.stringify(workflowData.configuration || {}),
      status: "draft",
      version: 1,
    });
    return { id, ...workflowData };
  } catch (error) {
    console.error("[Database] Failed to create workflow:", error);
    throw error;
  }
}

export async function listWorkflows(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(workflows)
    .where(eq(workflows.userId, userId));
}

export async function getWorkflow(workflowId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(workflows)
    .where(eq(workflows.id, workflowId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateWorkflowStatus(workflowId: string, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(workflows)
    .set({ status: status as any })
    .where(eq(workflows.id, workflowId));
}

// ============================================================================
// TASK OPERATIONS
// ============================================================================

export async function createTask(taskData: {
  userId: number;
  workflowId: string;
  input?: any;
  assignedAgents?: string[];
  priority?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = "task-" + nanoid();

  try {
    await db.insert(tasks).values({
      id,
      userId: taskData.userId,
      workflowId: taskData.workflowId,
      input: JSON.stringify(taskData.input || {}),
      assignedAgents: JSON.stringify(taskData.assignedAgents || []),
      priority: taskData.priority || 1,
      status: "pending",
      result: JSON.stringify({}),
    });
    return { id, ...taskData };
  } catch (error) {
    console.error("[Database] Failed to create task:", error);
    throw error;
  }
}

export async function listTasks(userId: number, workflowId?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(tasks.userId, userId)];
  if (workflowId) {
    conditions.push(eq(tasks.workflowId, workflowId));
  }

  return await db
    .select()
    .from(tasks)
    .where(and(...conditions));
}

export async function getTask(taskId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateTaskStatus(
  taskId: string,
  status: string,
  result?: any
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status: status as any };
  if (result) {
    updateData.result = JSON.stringify(result);
  }
  if (status === "completed" || status === "failed") {
    updateData.completedAt = new Date();
  }
  if (status === "running") {
    updateData.startedAt = new Date();
  }

  await db.update(tasks).set(updateData).where(eq(tasks.id, taskId));
}

// ============================================================================
// MESSAGE OPERATIONS
// ============================================================================

export async function createMessage(messageData: {
  userId: number;
  taskId: string;
  senderId: string;
  recipientId?: string;
  messageType: string;
  content?: any;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = "msg-" + nanoid();

  try {
    await db.insert(messages).values({
      id,
      userId: messageData.userId,
      taskId: messageData.taskId,
      senderId: messageData.senderId,
      recipientId: messageData.recipientId,
      messageType: messageData.messageType as any,
      content: JSON.stringify(messageData.content || {}),
      metadata: JSON.stringify(messageData.metadata || {}),
    });
    return { id, ...messageData };
  } catch (error) {
    console.error("[Database] Failed to create message:", error);
    throw error;
  }
}

export async function getTaskMessages(taskId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(messages)
    .where(eq(messages.taskId, taskId))
    .orderBy(desc(messages.createdAt));
}

// ============================================================================
// EXECUTION LOG OPERATIONS
// ============================================================================

export async function createExecutionLog(logData: {
  userId: number;
  taskId: string;
  agentId?: string;
  eventType: string;
  level: string;
  message: string;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = "log-" + nanoid();

  try {
    await db.insert(executionLogs).values({
      id,
      userId: logData.userId,
      taskId: logData.taskId,
      agentId: logData.agentId,
      eventType: logData.eventType as any,
      level: logData.level as any,
      message: logData.message,
      metadata: JSON.stringify(logData.metadata || {}),
    });
    return { id, ...logData };
  } catch (error) {
    console.error("[Database] Failed to create execution log:", error);
    throw error;
  }
}

export async function getTaskLogs(taskId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(executionLogs)
    .where(eq(executionLogs.taskId, taskId))
    .orderBy(desc(executionLogs.createdAt));
}

// ============================================================================
// METRICS OPERATIONS
// ============================================================================

export async function recordMetric(metricData: {
  userId: number;
  agentId: string;
  taskId?: string;
  executionTime?: number;
  tokenUsage?: number;
  estimatedCost?: number;
  successFlag?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = "metric-" + nanoid();

  try {
    await db.insert(metrics).values({
      id,
      userId: metricData.userId,
      agentId: metricData.agentId,
      taskId: metricData.taskId,
      executionTime: metricData.executionTime || 0,
      tokenUsage: metricData.tokenUsage || 0,
      estimatedCost: (metricData.estimatedCost || 0).toString(),
      successFlag: metricData.successFlag !== false,
    });
    return { id, ...metricData };
  } catch (error) {
    console.error("[Database] Failed to record metric:", error);
    throw error;
  }
}

export async function getAgentMetrics(agentId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(metrics)
    .where(eq(metrics.agentId, agentId))
    .orderBy(desc(metrics.createdAt));
}

// ============================================================================
// ALERT OPERATIONS
// ============================================================================

export async function createAlert(alertData: {
  userId: number;
  alertType: string;
  severity?: string;
  title: string;
  message?: string;
  relatedAgentId?: string;
  relatedTaskId?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = "alert-" + nanoid();

  try {
    await db.insert(alerts).values({
      id,
      userId: alertData.userId,
      alertType: alertData.alertType as any,
      severity: (alertData.severity || "info") as any,
      title: alertData.title,
      message: alertData.message || "",
      relatedAgentId: alertData.relatedAgentId,
      relatedTaskId: alertData.relatedTaskId,
      resolved: false,
    });
    return { id, ...alertData };
  } catch (error) {
    console.error("[Database] Failed to create alert:", error);
    throw error;
  }
}

export async function getUnresolvedAlerts(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(alerts)
    .where(and(eq(alerts.userId, userId), eq(alerts.resolved, false)))
    .orderBy(desc(alerts.createdAt));
}

export async function resolveAlert(alertId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(alerts)
    .set({ resolved: true, resolvedAt: new Date() })
    .where(eq(alerts.id, alertId));
}

// ============================================================================
// INTEGRATION OPERATIONS
// ============================================================================

export async function listIntegrations(userId: number, active?: boolean) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(integrations.userId, userId)];
  if (active !== undefined) {
    conditions.push(eq(integrations.active, active));
  }

  return await db
    .select()
    .from(integrations)
    .where(and(...conditions));
}

export async function getIntegration(userId: number, framework: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(integrations)
    .where(
      and(eq(integrations.userId, userId), eq(integrations.framework, framework))
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// LLM PROVIDER OPERATIONS
// ============================================================================

export async function listLLMProviders(userId: number, active?: boolean) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(llmProviders.userId, userId)];
  if (active !== undefined) {
    conditions.push(eq(llmProviders.active, active));
  }

  return await db
    .select()
    .from(llmProviders)
    .where(and(...conditions));
}

export async function getDefaultLLMProvider(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(llmProviders)
    .where(
      and(eq(llmProviders.userId, userId), eq(llmProviders.isDefault, true))
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// WORKFLOW TEMPLATE OPERATIONS
// ============================================================================

export async function getWorkflowTemplates(userId: number, category?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(workflowTemplates.userId, userId)];
  if (category) {
    conditions.push(eq(workflowTemplates.category, category));
  }

  return await db
    .select()
    .from(workflowTemplates)
    .where(and(...conditions));
}

// ============================================================================
// EXECUTION HISTORY OPERATIONS
// ============================================================================

export async function saveExecutionHistory(historyData: {
  userId: number;
  taskId: string;
  workflowId: string;
  input?: any;
  output?: any;
  conversationLog?: any;
  metrics?: any;
  executionTime: number;
  status: string;
  storageUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = "history-" + nanoid();

  try {
    await db.insert(executionHistory).values({
      id,
      userId: historyData.userId,
      taskId: historyData.taskId,
      workflowId: historyData.workflowId,
      input: JSON.stringify(historyData.input || {}),
      output: JSON.stringify(historyData.output || {}),
      conversationLog: JSON.stringify(historyData.conversationLog || []),
      metrics: JSON.stringify(historyData.metrics || {}),
      executionTime: historyData.executionTime,
      status: historyData.status as any,
      storageUrl: historyData.storageUrl,
    });
    return { id, ...historyData };
  } catch (error) {
    console.error("[Database] Failed to save execution history:", error);
    throw error;
  }
}

export async function getTaskHistory(taskId: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(executionHistory)
    .where(eq(executionHistory.taskId, taskId))
    .orderBy(desc(executionHistory.createdAt));
}

// ============================================================================
// CONSENSUS OPERATIONS
// ============================================================================

export async function saveConsensusResult(consensusData: {
  userId: number;
  taskId: string;
  consensusType: string;
  agentResults?: any;
  finalResult?: any;
  confidence?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = "consensus-" + nanoid();

  try {
    await db.insert(consensusResults).values({
      id,
      userId: consensusData.userId,
      taskId: consensusData.taskId,
      consensusType: consensusData.consensusType as any,
      agentResults: JSON.stringify(consensusData.agentResults || []),
      finalResult: JSON.stringify(consensusData.finalResult || {}),
      confidence: (consensusData.confidence || 0).toString(),
    });
    return { id, ...consensusData };
  } catch (error) {
    console.error("[Database] Failed to save consensus result:", error);
    throw error;
  }
}

// ============================================================================
// AGENT CONFIGURATION OPERATIONS
// ============================================================================

export async function saveAgentConfiguration(configData: {
  userId: number;
  agentId: string;
  workflowId?: string;
  parameters?: any;
  llmModel?: string;
  systemPrompt?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = "config-" + nanoid();

  try {
    await db.insert(agentConfigurations).values({
      id,
      userId: configData.userId,
      agentId: configData.agentId,
      workflowId: configData.workflowId,
      parameters: JSON.stringify(configData.parameters || {}),
      llmModel: configData.llmModel,
      systemPrompt: configData.systemPrompt,
    });
    return { id, ...configData };
  } catch (error) {
    console.error("[Database] Failed to save agent configuration:", error);
    throw error;
  }
}

export async function getAgentConfiguration(
  agentId: string,
  workflowId?: string
) {
  const db = await getDb();
  if (!db) return undefined;

  const conditions = [eq(agentConfigurations.agentId, agentId)];
  if (workflowId) {
    conditions.push(eq(agentConfigurations.workflowId, workflowId));
  }

  const result = await db
    .select()
    .from(agentConfigurations)
    .where(and(...conditions))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}
