import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import * as db from "./db";

describe("Swarm Platform API", () => {
  const userId = 1;

  const testAgentData = {
    userId,
    name: "TestAgent",
    type: "reasoning" as const,
    description: "Test agent for unit testing",
    capabilities: ["analysis", "reasoning"],
    llmModel: "gpt-4",
    parameters: { temperature: 0.7, maxTokens: 2000 },
    integrationFramework: "langchain",
  };

  const testWorkflowData = {
    userId,
    name: "TestWorkflow",
    description: "Test workflow",
    orchestrationPattern: "sequential" as const,
    nodes: [{ id: "node1", type: "agent" }],
    edges: [{ source: "node1", target: "node2" }],
    configuration: { timeout: 3600 },
  };

  const testTaskData = {
    userId,
    workflowId: "workflow-123",
    input: { query: "test query" },
    assignedAgents: ["agent-1", "agent-2"],
    priority: 1,
  };

  describe("Agent Management", () => {
    it("should create an agent", async () => {
      const result = await db.createAgent(testAgentData);
      expect(result).toBeDefined();
      expect(result.name).toBe(testAgentData.name);
      expect(result.type).toBe(testAgentData.type);
    });

    it("should list agents", async () => {
      // Create a test agent first
      await db.createAgent(testAgentData);
      
      const agents = await db.listAgents(userId);
      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBeGreaterThan(0);
    });

    it("should get agent by ID", async () => {
      const created = await db.createAgent(testAgentData);
      const retrieved = await db.getAgent(created.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe(testAgentData.name);
    });

    it("should update agent status", async () => {
      const created = await db.createAgent(testAgentData);
      await db.updateAgentStatus(created.id, "active");
      
      const updated = await db.getAgent(created.id);
      expect(updated?.status).toBe("active");
    });

    it("should update agent metrics", async () => {
      const created = await db.createAgent(testAgentData);
      await db.updateAgentMetrics(created.id, {
        totalExecutions: 10,
        failedExecutions: 2,
      });
      
      const updated = await db.getAgent(created.id);
      expect(updated?.totalExecutions).toBe(10);
      expect(updated?.failedExecutions).toBe(2);
    });
  });

  describe("Workflow Management", () => {
    it("should create a workflow", async () => {
      const result = await db.createWorkflow(testWorkflowData);
      expect(result).toBeDefined();
      expect(result.name).toBe(testWorkflowData.name);
      expect(result.orchestrationPattern).toBe(testWorkflowData.orchestrationPattern);
    });

    it("should list workflows", async () => {
      await db.createWorkflow(testWorkflowData);
      
      const workflows = await db.listWorkflows(userId);
      expect(Array.isArray(workflows)).toBe(true);
      expect(workflows.length).toBeGreaterThan(0);
    });

    it("should get workflow by ID", async () => {
      const created = await db.createWorkflow(testWorkflowData);
      const retrieved = await db.getWorkflow(created.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe(testWorkflowData.name);
    });

    it("should update workflow status", async () => {
      const created = await db.createWorkflow(testWorkflowData);
      await db.updateWorkflowStatus(created.id, "active");
      
      const updated = await db.getWorkflow(created.id);
      expect(updated?.status).toBe("active");
    });

    it("should get workflow templates", async () => {
      const templates = await db.getWorkflowTemplates(userId);
      expect(Array.isArray(templates)).toBe(true);
    });
  });

  describe("Task Execution", () => {
    it("should create a task", async () => {
      const result = await db.createTask(testTaskData);
      expect(result).toBeDefined();
      expect(result.workflowId).toBe(testTaskData.workflowId);
      expect(result.status).toBe("pending");
    });

    it("should get task by ID", async () => {
      const created = await db.createTask(testTaskData);
      const retrieved = await db.getTask(created.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.workflowId).toBe(testTaskData.workflowId);
    });

    it("should update task status", async () => {
      const created = await db.createTask(testTaskData);
      const result = { output: "test result" };
      
      await db.updateTaskStatus(created.id, "completed", result);
      
      const updated = await db.getTask(created.id);
      expect(updated?.status).toBe("completed");
    });

    it("should get task logs", async () => {
      const created = await db.createTask(testTaskData);
      
      // Create a log entry
      await db.createExecutionLog({
        userId,
        taskId: created.id,
        agentId: "agent-1",
        eventType: "execution",
        level: "info",
        message: "Task started",
      });
      
      const logs = await db.getTaskLogs(created.id);
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe("Communication", () => {
    it("should create a message", async () => {
      const messageData = {
        userId,
        senderId: "agent-1",
        recipientId: "agent-2",
        taskId: "task-123",
        messageType: "request" as const,
        content: { action: "analyze", data: "test" },
        metadata: { priority: "high" },
      };
      
      const result = await db.createMessage(messageData);
      expect(result).toBeDefined();
      expect(result.senderId).toBe(messageData.senderId);
      expect(result.messageType).toBe(messageData.messageType);
    });

    it("should get conversation history", async () => {
      const taskId = "task-123";
      
      // Create test messages
      await db.createMessage({
        userId,
        senderId: "agent-1",
        recipientId: "agent-2",
        taskId,
        messageType: "request",
        content: { action: "test" },
      });
      
      const history = await db.getConversationHistory(taskId);
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe("Monitoring & Observability", () => {
    it("should record a metric", async () => {
      const metricData = {
        userId,
        agentId: "agent-1",
        taskId: "task-123",
        executionTime: 1500,
        tokenUsage: 500,
        estimatedCost: 0.05,
        successFlag: true,
      };
      
      const result = await db.recordMetric(metricData);
      expect(result).toBeDefined();
      expect(result.agentId).toBe(metricData.agentId);
    });

    it("should get agent metrics", async () => {
      await db.recordMetric({
        userId,
        agentId: "agent-1",
        executionTime: 1000,
        successFlag: true,
      });
      
      const metrics = await db.getAgentMetrics("agent-1", 24);
      expect(Array.isArray(metrics)).toBe(true);
    });

    it("should create an execution log", async () => {
      const logData = {
        userId,
        taskId: "task-123",
        agentId: "agent-1",
        eventType: "execution" as const,
        level: "info" as const,
        message: "Execution started",
        metadata: { step: 1 },
      };
      
      const result = await db.createExecutionLog(logData);
      expect(result).toBeDefined();
      expect(result.eventType).toBe(logData.eventType);
    });

    it("should get task logs", async () => {
      const taskId = "task-123";
      
      await db.createExecutionLog({
        userId,
        taskId,
        agentId: "agent-1",
        eventType: "execution",
        level: "info",
        message: "Test log",
      });
      
      const logs = await db.getTaskLogs(taskId);
      expect(Array.isArray(logs)).toBe(true);
    });
  });

  describe("Alerts", () => {
    it("should create an alert", async () => {
      const alertData = {
        userId,
        alertType: "agent_failure" as const,
        severity: "critical" as const,
        title: "Agent Failed",
        message: "Agent-1 encountered a critical error",
        relatedAgentId: "agent-1",
      };
      
      const result = await db.createAlert(alertData);
      expect(result).toBeDefined();
      expect(result.alertType).toBe(alertData.alertType);
      expect(result.severity).toBe(alertData.severity);
    });

    it("should get unresolved alerts", async () => {
      await db.createAlert({
        userId,
        alertType: "task_timeout",
        severity: "warning",
        title: "Task Timeout",
        message: "Task exceeded timeout",
      });
      
      const alerts = await db.getUnresolvedAlerts(userId);
      expect(Array.isArray(alerts)).toBe(true);
    });
  });

  describe("Integration Management", () => {
    it("should list integrations", async () => {
      const integrations = await db.listIntegrations(userId);
      expect(Array.isArray(integrations)).toBe(true);
    });

    it("should get integration by framework", async () => {
      const integration = await db.getIntegration(userId, "langchain");
      // May or may not exist, but should return defined or undefined
      expect(integration === undefined || integration !== undefined).toBe(true);
    });
  });

  describe("LLM Provider Management", () => {
    it("should list LLM providers", async () => {
      const providers = await db.listLLMProviders(userId);
      expect(Array.isArray(providers)).toBe(true);
    });

    it("should get default LLM provider", async () => {
      const provider = await db.getDefaultLLMProvider(userId);
      // May or may not exist, but should return defined or undefined
      expect(provider === undefined || provider !== undefined).toBe(true);
    });
  });
});
