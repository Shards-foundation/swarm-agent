import {
  int,
  varchar,
  text,
  timestamp,
  mysqlEnum,
  mysqlTable,
  decimal,
  boolean,
  json,
  index,
  primaryKey,
  foreignKey,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

/**
 * Core user table - manages platform users and authentication
 */
export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }).unique(),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  },
  (table) => ({
    openIdIdx: index("idx_openId").on(table.openId),
    emailIdx: index("idx_email").on(table.email),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Agent registry - manages AI agents in the swarm
 */
export const swarmAgents = mysqlTable(
  "swarm_agents",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    type: mysqlEnum("type", ["reasoning", "execution", "coordination", "analysis"]).notNull(),
    description: text("description"),
    capabilities: json("capabilities").notNull(),
    status: mysqlEnum("status", ["active", "inactive", "error", "maintenance"]).default("active").notNull(),
    llmModel: varchar("llmModel", { length: 128 }),
    parameters: json("parameters").notNull(),
    integrationFramework: varchar("integrationFramework", { length: 128 }),
    version: varchar("version", { length: 32 }),
    healthScore: int("healthScore").default(100).notNull(),
    successRate: decimal("successRate", { precision: 5, scale: 2 }).default("100.00").notNull(),
    totalExecutions: int("totalExecutions").default(0).notNull(),
    failedExecutions: int("failedExecutions").default(0).notNull(),
    lastHeartbeat: timestamp("lastHeartbeat").defaultNow(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_agent_userId").on(table.userId),
    statusIdx: index("idx_agent_status").on(table.status),
    typeIdx: index("idx_agent_type").on(table.type),
  })
);

export type SwarmAgent = typeof swarmAgents.$inferSelect;
export type InsertSwarmAgent = typeof swarmAgents.$inferInsert;

/**
 * Workflows - defines multi-agent orchestration patterns
 */
export const workflows = mysqlTable(
  "workflows",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    orchestrationPattern: mysqlEnum("orchestrationPattern", [
      "hierarchical",
      "sequential",
      "concurrent",
      "round_robin",
      "mesh",
    ]).notNull(),
    nodes: json("nodes").notNull(),
    edges: json("edges").notNull(),
    configuration: json("configuration").notNull(),
    status: mysqlEnum("status", ["draft", "active", "paused", "archived"]).default("draft").notNull(),
    version: int("version").default(1).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_workflow_userId").on(table.userId),
    statusIdx: index("idx_workflow_status").on(table.status),
    patternIdx: index("idx_workflow_pattern").on(table.orchestrationPattern),
  })
);

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;

/**
 * Tasks - execution instances of workflows
 */
export const tasks = mysqlTable(
  "tasks",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: int("userId").notNull(),
    workflowId: varchar("workflowId", { length: 64 }).notNull(),
    input: json("input").notNull(),
    assignedAgents: json("assignedAgents").notNull(),
    priority: int("priority").default(1).notNull(),
    status: mysqlEnum("status", ["pending", "running", "completed", "failed", "timeout"]).default("pending").notNull(),
    result: json("result").notNull(),
    executionTime: int("executionTime"), // milliseconds
    startedAt: timestamp("startedAt"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_task_userId").on(table.userId),
    workflowIdIdx: index("idx_task_workflowId").on(table.workflowId),
    statusIdx: index("idx_task_status").on(table.status),
    priorityIdx: index("idx_task_priority").on(table.priority),
  })
);

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Messages - inter-agent communication
 */
export const messages = mysqlTable(
  "messages",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: int("userId").notNull(),
    taskId: varchar("taskId", { length: 64 }).notNull(),
    senderId: varchar("senderId", { length: 64 }).notNull(),
    recipientId: varchar("recipientId", { length: 64 }),
    messageType: mysqlEnum("messageType", ["request", "response", "status_update", "error", "broadcast"]).notNull(),
    content: json("content").notNull(),
    metadata: json("metadata").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_message_userId").on(table.userId),
    taskIdIdx: index("idx_message_taskId").on(table.taskId),
    senderIdIdx: index("idx_message_senderId").on(table.senderId),
    recipientIdIdx: index("idx_message_recipientId").on(table.recipientId),
  })
);

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Execution logs - detailed execution traces
 */
export const executionLogs = mysqlTable(
  "execution_logs",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: int("userId").notNull(),
    taskId: varchar("taskId", { length: 64 }).notNull(),
    agentId: varchar("agentId", { length: 64 }),
    eventType: mysqlEnum("eventType", ["execution", "decision", "error", "metric", "state_change"]).notNull(),
    level: mysqlEnum("level", ["debug", "info", "warning", "error", "critical"]).notNull(),
    message: text("message").notNull(),
    metadata: json("metadata").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_log_userId").on(table.userId),
    taskIdIdx: index("idx_log_taskId").on(table.taskId),
    agentIdIdx: index("idx_log_agentId").on(table.agentId),
    eventTypeIdx: index("idx_log_eventType").on(table.eventType),
    levelIdx: index("idx_log_level").on(table.level),
  })
);

export type ExecutionLog = typeof executionLogs.$inferSelect;
export type InsertExecutionLog = typeof executionLogs.$inferInsert;

/**
 * Metrics - agent and task performance metrics
 */
export const metrics = mysqlTable(
  "metrics",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: int("userId").notNull(),
    agentId: varchar("agentId", { length: 64 }).notNull(),
    taskId: varchar("taskId", { length: 64 }),
    executionTime: int("executionTime").notNull(), // milliseconds
    tokenUsage: int("tokenUsage").default(0).notNull(),
    estimatedCost: decimal("estimatedCost", { precision: 10, scale: 6 }).default("0.000000").notNull(),
    successFlag: boolean("successFlag").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_metric_userId").on(table.userId),
    agentIdIdx: index("idx_metric_agentId").on(table.agentId),
    taskIdIdx: index("idx_metric_taskId").on(table.taskId),
  })
);

export type Metric = typeof metrics.$inferSelect;
export type InsertMetric = typeof metrics.$inferInsert;

/**
 * Alerts - critical event notifications
 */
export const alerts = mysqlTable(
  "alerts",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: int("userId").notNull(),
    alertType: mysqlEnum("alertType", [
      "agent_failure",
      "task_timeout",
      "system_error",
      "task_completion",
      "performance_degradation",
    ]).notNull(),
    severity: mysqlEnum("severity", ["info", "warning", "critical"]).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    relatedAgentId: varchar("relatedAgentId", { length: 64 }),
    relatedTaskId: varchar("relatedTaskId", { length: 64 }),
    resolved: boolean("resolved").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    resolvedAt: timestamp("resolvedAt"),
  },
  (table) => ({
    userIdIdx: index("idx_alert_userId").on(table.userId),
    alertTypeIdx: index("idx_alert_alertType").on(table.alertType),
    severityIdx: index("idx_alert_severity").on(table.severity),
    resolvedIdx: index("idx_alert_resolved").on(table.resolved),
  })
);

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

/**
 * Integration configurations - framework and provider settings
 */
export const integrations = mysqlTable(
  "integrations",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: int("userId").notNull(),
    framework: varchar("framework", { length: 128 }).notNull(),
    version: varchar("version", { length: 32 }).notNull(),
    active: boolean("active").default(true).notNull(),
    configuration: json("configuration").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_integration_userId").on(table.userId),
    frameworkIdx: index("idx_integration_framework").on(table.framework),
  })
);

export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = typeof integrations.$inferInsert;

/**
 * LLM providers - language model configurations
 */
export const llmProviders = mysqlTable(
  "llm_providers",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 128 }).notNull(),
    provider: mysqlEnum("provider", ["openai", "anthropic", "ollama", "custom"]).notNull(),
    model: varchar("model", { length: 128 }).notNull(),
    apiKey: varchar("apiKey", { length: 512 }),
    baseUrl: varchar("baseUrl", { length: 512 }),
    active: boolean("active").default(true).notNull(),
    isDefault: boolean("isDefault").default(false).notNull(),
    configuration: json("configuration").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_llm_userId").on(table.userId),
    providerIdx: index("idx_llm_provider").on(table.provider),
    activeIdx: index("idx_llm_active").on(table.active),
  })
);

export type LLMProvider = typeof llmProviders.$inferSelect;
export type InsertLLMProvider = typeof llmProviders.$inferInsert;

/**
 * Workflow templates - pre-configured swarm architectures
 */
export const workflowTemplates = mysqlTable(
  "workflow_templates",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: int("userId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 128 }),
    orchestrationPattern: mysqlEnum("orchestrationPattern", [
      "hierarchical",
      "sequential",
      "concurrent",
      "round_robin",
      "mesh",
    ]).notNull(),
    templateData: json("templateData").notNull(),
    isPublic: boolean("isPublic").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_template_userId").on(table.userId),
    categoryIdx: index("idx_template_category").on(table.category),
  })
);

export type WorkflowTemplate = typeof workflowTemplates.$inferSelect;
export type InsertWorkflowTemplate = typeof workflowTemplates.$inferInsert;

/**
 * Execution history - archived results and conversation logs
 */
export const executionHistory = mysqlTable(
  "execution_history",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: int("userId").notNull(),
    taskId: varchar("taskId", { length: 64 }).notNull(),
    workflowId: varchar("workflowId", { length: 64 }).notNull(),
    input: json("input").notNull(),
    output: json("output").notNull(),
    conversationLog: json("conversationLog").notNull(),
    metrics: json("metrics").notNull(),
    executionTime: int("executionTime").notNull(),
    status: mysqlEnum("status", ["completed", "failed", "timeout"]).notNull(),
    storageUrl: varchar("storageUrl", { length: 512 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_history_userId").on(table.userId),
    taskIdIdx: index("idx_history_taskId").on(table.taskId),
    workflowIdIdx: index("idx_history_workflowId").on(table.workflowId),
  })
);

export type ExecutionHistory = typeof executionHistory.$inferSelect;
export type InsertExecutionHistory = typeof executionHistory.$inferInsert;

/**
 * Consensus results - aggregated results from multiple agents
 */
export const consensusResults = mysqlTable(
  "consensus_results",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: int("userId").notNull(),
    taskId: varchar("taskId", { length: 64 }).notNull(),
    consensusType: mysqlEnum("consensusType", ["voting", "judge_based", "mixture_of_agents"]).notNull(),
    agentResults: json("agentResults").notNull(),
    finalResult: json("finalResult").notNull(),
    confidence: decimal("confidence", { precision: 5, scale: 4 }).default("0.0000").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_consensus_userId").on(table.userId),
    taskIdIdx: index("idx_consensus_taskId").on(table.taskId),
  })
);

export type ConsensusResult = typeof consensusResults.$inferSelect;
export type InsertConsensusResult = typeof consensusResults.$inferInsert;

/**
 * Agent configurations - per-agent parameter overrides
 */
export const agentConfigurations = mysqlTable(
  "agent_configurations",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: int("userId").notNull(),
    agentId: varchar("agentId", { length: 64 }).notNull(),
    workflowId: varchar("workflowId", { length: 64 }),
    parameters: json("parameters").notNull(),
    llmModel: varchar("llmModel", { length: 128 }),
    systemPrompt: text("systemPrompt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_config_userId").on(table.userId),
    agentIdIdx: index("idx_config_agentId").on(table.agentId),
    workflowIdIdx: index("idx_config_workflowId").on(table.workflowId),
  })
);

export type AgentConfiguration = typeof agentConfigurations.$inferSelect;
export type InsertAgentConfiguration = typeof agentConfigurations.$inferInsert;
