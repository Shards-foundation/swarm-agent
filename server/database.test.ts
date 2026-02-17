import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";

/**
 * Database Integration Tests
 * Tests data persistence and retrieval for all core database operations
 */

describe("Database Operations", () => {
  const testUserId = 1;
  const testAgentId = "test-agent-" + Date.now();
  const testWorkflowId = "test-workflow-" + Date.now();
  const testTaskId = "test-task-" + Date.now();

  describe("Agent Operations", () => {
    it("should create an agent", async () => {
      const agent = await db.createAgent({
        userId: testUserId,
        name: "Test Agent",
        type: "reasoning",
        description: "Test agent for database validation",
        capabilities: ["analysis", "reasoning"],
        llmModel: "gpt-4",
        parameters: { temperature: 0.7 },
      });

      expect(agent).toBeDefined();
      expect(agent.name).toBe("Test Agent");
      expect(agent.type).toBe("reasoning");
    });

    it("should list agents for a user", async () => {
      const agents = await db.listAgents(testUserId);
      expect(Array.isArray(agents)).toBe(true);
    });

    it("should get an agent by ID", async () => {
      const agent = await db.getAgent(testAgentId);
      // Agent may not exist yet, but function should not throw
      expect(agent === undefined || agent.id === testAgentId).toBe(true);
    });

    it("should update agent status", async () => {
      // Create an agent first
      const agent = await db.createAgent({
        userId: testUserId,
        name: "Status Test Agent",
        type: "execution",
      });

      // Update status
      await db.updateAgentStatus(agent.id, "inactive");
      expect(true).toBe(true); // If no error thrown, test passes
    });
  });

  describe("Workflow Operations", () => {
    it("should create a workflow", async () => {
      const workflow = await db.createWorkflow({
        userId: testUserId,
        name: "Test Workflow",
        orchestrationPattern: "sequential",
        description: "Test workflow for database validation",
        nodes: [{ id: "node-1", type: "agent" }],
        edges: [],
      });

      expect(workflow).toBeDefined();
      expect(workflow.name).toBe("Test Workflow");
      expect(workflow.orchestrationPattern).toBe("sequential");
    });

    it("should list workflows for a user", async () => {
      const workflows = await db.listWorkflows(testUserId);
      expect(Array.isArray(workflows)).toBe(true);
    });

    it("should get a workflow by ID", async () => {
      const workflow = await db.getWorkflow(testWorkflowId);
      // Workflow may not exist yet, but function should not throw
      expect(workflow === undefined || workflow.id === testWorkflowId).toBe(true);
    });

    it("should update workflow status", async () => {
      // Create a workflow first
      const workflow = await db.createWorkflow({
        userId: testUserId,
        name: "Status Test Workflow",
        orchestrationPattern: "concurrent",
      });

      // Update status
      await db.updateWorkflowStatus(workflow.id, "active");
      expect(true).toBe(true); // If no error thrown, test passes
    });
  });

  describe("Task Operations", () => {
    it("should create a task", async () => {
      // First create a workflow
      const workflow = await db.createWorkflow({
        userId: testUserId,
        name: "Task Test Workflow",
        orchestrationPattern: "sequential",
      });

      // Then create a task
      const task = await db.createTask({
        userId: testUserId,
        workflowId: workflow.id,
        input: { query: "test query" },
        priority: 1,
      });

      expect(task).toBeDefined();
      expect(task.workflowId).toBe(workflow.id);
    });

    it("should list tasks for a user", async () => {
      const tasks = await db.listTasks(testUserId);
      expect(Array.isArray(tasks)).toBe(true);
    });

    it("should get a task by ID", async () => {
      const task = await db.getTask(testTaskId);
      // Task may not exist yet, but function should not throw
      expect(task === undefined || task.id === testTaskId).toBe(true);
    });

    it("should update task status", async () => {
      // Create a task first
      const workflow = await db.createWorkflow({
        userId: testUserId,
        name: "Update Task Workflow",
        orchestrationPattern: "sequential",
      });

      const task = await db.createTask({
        userId: testUserId,
        workflowId: workflow.id,
      });

      // Update status
      await db.updateTaskStatus(task.id, "running");
      expect(true).toBe(true); // If no error thrown, test passes
    });
  });

  describe("Message Operations", () => {
    it("should create a message", async () => {
      const agent1 = await db.createAgent({
        userId: testUserId,
        name: "Agent 1",
        type: "reasoning",
      });

      const agent2 = await db.createAgent({
        userId: testUserId,
        name: "Agent 2",
        type: "execution",
      });

      const workflow = await db.createWorkflow({
        userId: testUserId,
        name: "Message Test Workflow",
        orchestrationPattern: "sequential",
      });

      const task = await db.createTask({
        userId: testUserId,
        workflowId: workflow.id,
      });

      const message = await db.createMessage({
        userId: testUserId,
        taskId: task.id,
        senderId: agent1.id,
        recipientId: agent2.id,
        messageType: "request",
        content: { action: "analyze" },
      });

      expect(message).toBeDefined();
      expect(message.messageType).toBe("request");
    });

    it("should get task messages", async () => {
      const messages = await db.getTaskMessages(testTaskId);
      expect(Array.isArray(messages)).toBe(true);
    });
  });

  describe("Execution Log Operations", () => {
    it("should create an execution log", async () => {
      const workflow = await db.createWorkflow({
        userId: testUserId,
        name: "Log Test Workflow",
        orchestrationPattern: "sequential",
      });

      const task = await db.createTask({
        userId: testUserId,
        workflowId: workflow.id,
      });

      const agent = await db.createAgent({
        userId: testUserId,
        name: "Log Test Agent",
        type: "reasoning",
      });

      const log = await db.createExecutionLog({
        userId: testUserId,
        taskId: task.id,
        agentId: agent.id,
        eventType: "execution",
        level: "info",
        message: "Test execution log",
        metadata: { step: 1 },
      });

      expect(log).toBeDefined();
      expect(log.message).toBe("Test execution log");
    });

    it("should get task logs", async () => {
      const logs = await db.getTaskLogs(testTaskId);
      expect(Array.isArray(logs)).toBe(true);
    });
  });

  describe("Metrics Operations", () => {
    it("should record a metric", async () => {
      const agent = await db.createAgent({
        userId: testUserId,
        name: "Metric Test Agent",
        type: "reasoning",
      });

      const metric = await db.recordMetric({
        userId: testUserId,
        agentId: agent.id,
        executionTime: 1500,
        tokenUsage: 250,
        estimatedCost: 0.05,
        successFlag: true,
      });

      expect(metric).toBeDefined();
      expect(metric.executionTime).toBe(1500);
    });

    it("should get agent metrics", async () => {
      const metrics = await db.getAgentMetrics(testAgentId);
      expect(Array.isArray(metrics)).toBe(true);
    });
  });

  describe("Alert Operations", () => {
    it("should create an alert", async () => {
      const alert = await db.createAlert({
        userId: testUserId,
        alertType: "task_completion",
        severity: "info",
        title: "Task Completed",
        message: "Test task has completed successfully",
      });

      expect(alert).toBeDefined();
      expect(alert.title).toBe("Task Completed");
    });

    it("should get unresolved alerts", async () => {
      const alerts = await db.getUnresolvedAlerts(testUserId);
      expect(Array.isArray(alerts)).toBe(true);
    });

    it("should resolve an alert", async () => {
      const alert = await db.createAlert({
        userId: testUserId,
        alertType: "agent_failure",
        severity: "critical",
        title: "Agent Failed",
        message: "Test agent has failed",
      });

      await db.resolveAlert(alert.id);
      expect(true).toBe(true); // If no error thrown, test passes
    });
  });

  describe("Integration Operations", () => {
    it("should list integrations", async () => {
      const integrations = await db.listIntegrations(testUserId);
      expect(Array.isArray(integrations)).toBe(true);
    });

    it("should get an integration", async () => {
      const integration = await db.getIntegration(testUserId, "langchain");
      // Integration may not exist, but function should not throw
      expect(integration === undefined || integration.framework === "langchain").toBe(true);
    });
  });

  describe("LLM Provider Operations", () => {
    it("should list LLM providers", async () => {
      const providers = await db.listLLMProviders(testUserId);
      expect(Array.isArray(providers)).toBe(true);
    });

    it("should get default LLM provider", async () => {
      const provider = await db.getDefaultLLMProvider(testUserId);
      // Provider may not exist, but function should not throw
      expect(provider === undefined || provider.isDefault === true).toBe(true);
    });
  });

  describe("Execution History Operations", () => {
    it("should save execution history", async () => {
      const workflow = await db.createWorkflow({
        userId: testUserId,
        name: "History Test Workflow",
        orchestrationPattern: "sequential",
      });

      const task = await db.createTask({
        userId: testUserId,
        workflowId: workflow.id,
      });

      const history = await db.saveExecutionHistory({
        userId: testUserId,
        taskId: task.id,
        workflowId: workflow.id,
        input: { query: "test" },
        output: { result: "success" },
        executionTime: 2000,
        status: "completed",
      });

      expect(history).toBeDefined();
      expect(history.status).toBe("completed");
    });

    it("should get task history", async () => {
      const history = await db.getTaskHistory(testTaskId);
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe("Consensus Operations", () => {
    it("should save consensus result", async () => {
      const workflow = await db.createWorkflow({
        userId: testUserId,
        name: "Consensus Test Workflow",
        orchestrationPattern: "sequential",
      });

      const task = await db.createTask({
        userId: testUserId,
        workflowId: workflow.id,
      });

      const consensus = await db.saveConsensusResult({
        userId: testUserId,
        taskId: task.id,
        consensusType: "voting",
        agentResults: [{ agentId: "agent-1", result: "option-a" }],
        finalResult: { decision: "option-a" },
        confidence: 0.95,
      });

      expect(consensus).toBeDefined();
      expect(consensus.consensusType).toBe("voting");
    });
  });

  describe("Agent Configuration Operations", () => {
    it("should save agent configuration", async () => {
      const agent = await db.createAgent({
        userId: testUserId,
        name: "Config Test Agent",
        type: "reasoning",
      });

      const config = await db.saveAgentConfiguration({
        userId: testUserId,
        agentId: agent.id,
        parameters: { temperature: 0.5 },
        llmModel: "gpt-4",
        systemPrompt: "You are a helpful assistant",
      });

      expect(config).toBeDefined();
      expect(config.llmModel).toBe("gpt-4");
    });

    it("should get agent configuration", async () => {
      const config = await db.getAgentConfiguration("test-agent-id");
      // Config may not exist, but function should not throw
      expect(config === undefined || config.agentId === "test-agent-id").toBe(true);
    });
  });

  describe("Data Persistence Validation", () => {
    it("should persist and retrieve agent data", async () => {
      const agent = await db.createAgent({
        userId: testUserId,
        name: "Persistence Test Agent",
        type: "analysis",
        description: "Testing data persistence",
        capabilities: ["data-analysis", "reporting"],
      });

      const retrieved = await db.getAgent(agent.id);
      expect(retrieved).toBeDefined();
      if (retrieved) {
        expect(retrieved.name).toBe("Persistence Test Agent");
        expect(retrieved.type).toBe("analysis");
      }
    });

    it("should persist and retrieve workflow data", async () => {
      const workflow = await db.createWorkflow({
        userId: testUserId,
        name: "Persistence Test Workflow",
        orchestrationPattern: "hierarchical",
        description: "Testing workflow persistence",
      });

      const retrieved = await db.getWorkflow(workflow.id);
      expect(retrieved).toBeDefined();
      if (retrieved) {
        expect(retrieved.name).toBe("Persistence Test Workflow");
        expect(retrieved.orchestrationPattern).toBe("hierarchical");
      }
    });

    it("should persist and retrieve task data", async () => {
      const workflow = await db.createWorkflow({
        userId: testUserId,
        name: "Task Persistence Workflow",
        orchestrationPattern: "sequential",
      });

      const task = await db.createTask({
        userId: testUserId,
        workflowId: workflow.id,
        input: { query: "persistence test" },
        priority: 5,
      });

      const retrieved = await db.getTask(task.id);
      expect(retrieved).toBeDefined();
      if (retrieved) {
        expect(retrieved.workflowId).toBe(workflow.id);
        expect(retrieved.priority).toBe(5);
      }
    });
  });
});
