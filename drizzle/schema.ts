import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  float,
  boolean,
  bigint,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
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
 * Agent Registry - Catalog of all AI agents in the system
 */
export const agents = mysqlTable(
  "swarm_agents",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // UUID
    name: varchar("name", { length: 255 }).notNull(),
    type: mysqlEnum("type", ["reasoning", "execution", "coordination", "analysis"]).notNull(),
    description: text("description"),
    capabilities: json("capabilities").$type<string[]>(),
    status: mysqlEnum("status", ["active", "inactive", "error", "maintenance"]).default("active"),
    llmModel: varchar("llmModel", { length: 255 }),
    parameters: json("parameters").$type<Record<string, unknown>>(),
    integrationFramework: varchar("integrationFramework", { length: 255 }),
    version: varchar("version", { length: 64 }),
    healthScore: float("healthScore").default(100),
    successRate: float("successRate").default(100),
    totalExecutions: int("totalExecutions").default(0),
    failedExecutions: int("failedExecutions").default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    statusIdx: index("swarm_agents_status_idx").on(table.status),
    typeIdx: index("swarm_agents_type_idx").on(table.type),
    frameworkIdx: index("swarm_agents_framework_idx").on(table.integrationFramework),
  })
);

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

/**
 * Workflow Definitions - Templates for multi-agent orchestration
 */
export const workflows = mysqlTable(
  "swarm_workflows",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // UUID
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    orchestrationPattern: mysqlEnum("orchestrationPattern", [
      "hierarchical",
      "sequential",
      "concurrent",
      "round_robin",
      "mesh",
    ]).notNull(),
    nodes: json("nodes").$type<Array<Record<string, unknown>>>(),
    edges: json("edges").$type<Array<Record<string, unknown>>>(),
    configuration: json("configuration").$type<Record<string, unknown>>(),
    status: mysqlEnum("status", ["draft", "active", "paused", "archived"]).default("draft"),
    templateId: varchar("templateId", { length: 36 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    statusIdx: index("swarm_workflows_status_idx").on(table.status),
    patternIdx: index("swarm_workflows_pattern_idx").on(table.orchestrationPattern),
  })
);

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;

/**
 * Task Execution - Individual tasks executed by agents
 */
export const tasks = mysqlTable(
  "swarm_tasks",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // UUID
    workflowId: varchar("workflowId", { length: 36 }).notNull(),
    input: json("input").$type<Record<string, unknown>>(),
    assignedAgents: json("assignedAgents").$type<string[]>(),
    status: mysqlEnum("status", ["pending", "running", "completed", "failed", "timeout"]).default("pending"),
    priority: int("priority").default(5),
    result: json("result").$type<Record<string, unknown>>(),
    consensusResult: json("consensusResult").$type<Record<string, unknown>>(),
    consensusMethod: mysqlEnum("consensusMethod", ["voting", "judge", "mixture_of_agents", "none"]).default("none"),
    executionTime: bigint("executionTime", { mode: "number" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    startedAt: timestamp("startedAt"),
    completedAt: timestamp("completedAt"),
    retryCount: int("retryCount").default(0),
    errorLog: text("errorLog"),
    storageUrl: varchar("storageUrl", { length: 512 }),
  },
  (table) => ({
    workflowIdx: index("swarm_tasks_workflow_idx").on(table.workflowId),
    statusIdx: index("swarm_tasks_status_idx").on(table.status),
    createdIdx: index("swarm_tasks_created_idx").on(table.createdAt),
  })
);

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Agent Communication - Messages between agents
 */
export const agentMessages = mysqlTable(
  "swarm_messages",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // UUID
    senderId: varchar("senderId", { length: 36 }).notNull(),
    recipientId: varchar("recipientId", { length: 36 }),
    taskId: varchar("taskId", { length: 36 }),
    messageType: mysqlEnum("messageType", ["request", "response", "status_update", "error", "broadcast"]).notNull(),
    content: json("content").$type<Record<string, unknown>>(),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    deliveryStatus: mysqlEnum("deliveryStatus", ["pending", "delivered", "acknowledged", "failed"]).default("pending"),
    metadata: json("metadata").$type<Record<string, unknown>>(),
  },
  (table) => ({
    senderIdx: index("swarm_messages_sender_idx").on(table.senderId),
    recipientIdx: index("swarm_messages_recipient_idx").on(table.recipientId),
    taskIdx: index("swarm_messages_task_idx").on(table.taskId),
    timestampIdx: index("swarm_messages_timestamp_idx").on(table.timestamp),
  })
);

export type AgentMessage = typeof agentMessages.$inferSelect;
export type InsertAgentMessage = typeof agentMessages.$inferInsert;

/**
 * Execution Logs - Detailed logs of agent execution
 */
export const executionLogs = mysqlTable(
  "swarm_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // UUID
    taskId: varchar("taskId", { length: 36 }).notNull(),
    agentId: varchar("agentId", { length: 36 }).notNull(),
    eventType: mysqlEnum("eventType", ["execution", "decision", "error", "metric", "state_change"]).notNull(),
    level: mysqlEnum("level", ["debug", "info", "warning", "error", "critical"]).default("info"),
    message: text("message"),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    storageUrl: varchar("storageUrl", { length: 512 }),
  },
  (table) => ({
    taskIdx: index("swarm_logs_task_idx").on(table.taskId),
    agentIdx: index("swarm_logs_agent_idx").on(table.agentId),
    timestampIdx: index("swarm_logs_timestamp_idx").on(table.timestamp),
    levelIdx: index("swarm_logs_level_idx").on(table.level),
  })
);

export type ExecutionLog = typeof executionLogs.$inferSelect;
export type InsertExecutionLog = typeof executionLogs.$inferInsert;

/**
 * Orchestration Configuration - Settings for specific orchestration patterns
 */
export const orchestrationConfigs = mysqlTable(
  "swarm_configs",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // UUID
    workflowId: varchar("workflowId", { length: 36 }).notNull().unique(),
    hierarchyRules: json("hierarchyRules").$type<Record<string, unknown>>(),
    sequenceRules: json("sequenceRules").$type<Record<string, unknown>>(),
    concurrencyRules: json("concurrencyRules").$type<Record<string, unknown>>(),
    roundRobinRules: json("roundRobinRules").$type<Record<string, unknown>>(),
    consensusStrategy: json("consensusStrategy").$type<Record<string, unknown>>(),
    timeoutPolicy: json("timeoutPolicy").$type<Record<string, unknown>>(),
    resourceLimits: json("resourceLimits").$type<Record<string, unknown>>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    workflowIdx: index("swarm_config_workflow_idx").on(table.workflowId),
  })
);

export type OrchestrationConfig = typeof orchestrationConfigs.$inferSelect;
export type InsertOrchestrationConfig = typeof orchestrationConfigs.$inferInsert;

/**
 * Workflow Templates - Pre-configured swarm architectures
 */
export const workflowTemplates = mysqlTable(
  "swarm_templates",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // UUID
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: mysqlEnum("category", [
      "hierarchical",
      "sequential",
      "concurrent",
      "round_robin",
      "mesh",
      "mixture_of_agents",
    ]).notNull(),
    templateData: json("templateData").$type<Record<string, unknown>>(),
    previewImage: varchar("previewImage", { length: 512 }),
    isPublic: boolean("isPublic").default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    categoryIdx: index("swarm_templates_category_idx").on(table.category),
  })
);

export type WorkflowTemplate = typeof workflowTemplates.$inferSelect;
export type InsertWorkflowTemplate = typeof workflowTemplates.$inferInsert;

/**
 * Agent Performance Metrics - Real-time performance tracking
 */
export const agentMetrics = mysqlTable(
  "swarm_metrics",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // UUID
    agentId: varchar("agentId", { length: 36 }).notNull(),
    taskId: varchar("taskId", { length: 36 }),
    executionTime: bigint("executionTime", { mode: "number" }),
    tokenUsage: int("tokenUsage"),
    estimatedCost: float("estimatedCost"),
    successFlag: boolean("successFlag"),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
  },
  (table) => ({
    agentIdx: index("swarm_metrics_agent_idx").on(table.agentId),
    taskIdx: index("swarm_metrics_task_idx").on(table.taskId),
    timestampIdx: index("swarm_metrics_timestamp_idx").on(table.timestamp),
  })
);

export type AgentMetric = typeof agentMetrics.$inferSelect;
export type InsertAgentMetric = typeof agentMetrics.$inferInsert;

/**
 * System Alerts - Critical events and notifications
 */
export const systemAlerts = mysqlTable(
  "swarm_alerts",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // UUID
    alertType: mysqlEnum("alertType", [
      "agent_failure",
      "task_timeout",
      "system_error",
      "task_completion",
      "performance_degradation",
    ]).notNull(),
    severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("info"),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message"),
    relatedAgentId: varchar("relatedAgentId", { length: 36 }),
    relatedTaskId: varchar("relatedTaskId", { length: 36 }),
    isResolved: boolean("isResolved").default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    resolvedAt: timestamp("resolvedAt"),
  },
  (table) => ({
    typeIdx: index("swarm_alerts_type_idx").on(table.alertType),
    severityIdx: index("swarm_alerts_severity_idx").on(table.severity),
    createdIdx: index("swarm_alerts_created_idx").on(table.createdAt),
  })
);

export type SystemAlert = typeof systemAlerts.$inferSelect;
export type InsertSystemAlert = typeof systemAlerts.$inferInsert;

/**
 * Integration Modules - Registered open-source project integrations
 */
export const integrationModules = mysqlTable(
  "swarm_integrations",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // UUID
    name: varchar("name", { length: 255 }).notNull(),
    framework: varchar("framework", { length: 255 }).notNull(),
    version: varchar("version", { length: 64 }),
    description: text("description"),
    capabilities: json("capabilities").$type<string[]>(),
    configuration: json("configuration").$type<Record<string, unknown>>(),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    frameworkIdx: index("swarm_integrations_framework_idx").on(table.framework),
  })
);

export type IntegrationModule = typeof integrationModules.$inferSelect;
export type InsertIntegrationModule = typeof integrationModules.$inferInsert;

/**
 * LLM Provider Configuration - Settings for different LLM models
 */
export const llmProviders = mysqlTable(
  "swarm_llm_providers",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // UUID
    name: varchar("name", { length: 255 }).notNull(),
    provider: mysqlEnum("provider", ["openai", "anthropic", "ollama", "custom"]).notNull(),
    modelId: varchar("modelId", { length: 255 }).notNull(),
    apiEndpoint: varchar("apiEndpoint", { length: 512 }),
    configuration: json("configuration").$type<Record<string, unknown>>(),
    isDefault: boolean("isDefault").default(false),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    providerIdx: index("swarm_llm_provider_idx").on(table.provider),
    modelIdx: index("swarm_llm_model_idx").on(table.modelId),
  })
);

export type LLMProvider = typeof llmProviders.$inferSelect;
export type InsertLLMProvider = typeof llmProviders.$inferInsert;
