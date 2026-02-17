# API Documentation

## Overview

The Ultimate Swarm Agents Platform provides a comprehensive tRPC-based API for managing agents, workflows, tasks, and monitoring. All endpoints are type-safe with automatic TypeScript type generation.

## Quick Start

### Authentication

All protected endpoints require authentication via JWT tokens obtained through OAuth 2.0:

```typescript
import { trpc } from '@/lib/trpc';

// Check current user
const { data: user } = trpc.auth.me.useQuery();

// Logout
const logout = trpc.auth.logout.useMutation();
logout.mutate();
```

### Error Handling

```typescript
try {
  const result = await trpc.agent.create.mutate({
    name: 'MyAgent',
    type: 'reasoning',
  });
} catch (error) {
  if (error.code === 'UNAUTHORIZED') {
    // Handle auth error
  } else if (error.code === 'BAD_REQUEST') {
    // Handle validation error
  }
}
```

## Agent Management API

### Create Agent

Create a new AI agent with specified capabilities and configuration.

```typescript
const agent = await trpc.agent.create.mutate({
  name: 'AnalysisAgent',
  type: 'reasoning', // 'reasoning' | 'execution' | 'coordination' | 'analysis'
  description: 'Analyzes complex data structures',
  capabilities: ['data_analysis', 'pattern_recognition'],
  llmModel: 'gpt-4',
  parameters: {
    temperature: 0.7,
    maxTokens: 2000,
  },
  integrationFramework: 'langchain',
  version: '1.0.0',
});

// Response:
// {
//   id: 'agent-123',
//   name: 'AnalysisAgent',
//   type: 'reasoning',
//   status: 'active',
//   healthScore: 100,
//   successRate: 100,
//   createdAt: Date,
//   updatedAt: Date,
// }
```

### Get Agent

Retrieve details for a specific agent.

```typescript
const agent = await trpc.agent.get.query({
  agentId: 'agent-123',
});
```

### List Agents

Retrieve all agents with optional filtering.

```typescript
const agents = await trpc.agent.list.query({
  status: 'active', // optional
  type: 'reasoning', // optional
});

// Returns: Agent[]
```

### Update Agent Status

Change agent status (active, inactive, error, maintenance).

```typescript
await trpc.agent.updateStatus.mutate({
  agentId: 'agent-123',
  status: 'active',
});
```

### Update Agent Metrics

Record agent performance metrics.

```typescript
await trpc.agent.updateMetrics.mutate({
  agentId: 'agent-123',
  successCount: 150,
  failureCount: 5,
});
```

## Workflow Management API

### Create Workflow

Define a new multi-agent workflow.

```typescript
const workflow = await trpc.workflow.create.mutate({
  name: 'DataProcessingPipeline',
  description: 'Multi-stage data processing workflow',
  orchestrationPattern: 'sequential', // 'hierarchical' | 'sequential' | 'concurrent' | 'round_robin' | 'mesh'
  nodes: [
    { id: 'node1', type: 'agent', agentId: 'agent-1' },
    { id: 'node2', type: 'agent', agentId: 'agent-2' },
  ],
  edges: [
    { source: 'node1', target: 'node2' },
  ],
  configuration: {
    timeout: 3600,
    maxRetries: 3,
  },
});

// Response:
// {
//   id: 'workflow-123',
//   name: 'DataProcessingPipeline',
//   orchestrationPattern: 'sequential',
//   status: 'draft',
//   createdAt: Date,
// }
```

### Get Workflow

Retrieve workflow details.

```typescript
const workflow = await trpc.workflow.get.query({
  workflowId: 'workflow-123',
});
```

### List Workflows

Retrieve all workflows.

```typescript
const workflows = await trpc.workflow.list.query({
  status: 'active', // optional
});
```

### Update Workflow Status

Change workflow status (draft, active, paused, archived).

```typescript
await trpc.workflow.updateStatus.mutate({
  workflowId: 'workflow-123',
  status: 'active',
});
```

### Get Workflow Templates

Retrieve pre-configured workflow templates.

```typescript
const templates = await trpc.workflow.getTemplates.query({
  category: 'data_processing', // optional
});
```

## Task Execution API

### Create Task

Create a new task for workflow execution.

```typescript
const task = await trpc.task.create.mutate({
  workflowId: 'workflow-123',
  input: {
    data: 'process this data',
    options: { verbose: true },
  },
  assignedAgents: ['agent-1', 'agent-2'],
  priority: 1,
});

// Response:
// {
//   id: 'task-123',
//   workflowId: 'workflow-123',
//   status: 'pending',
//   createdAt: Date,
// }
```

### Get Task

Retrieve task details and status.

```typescript
const task = await trpc.task.get.query({
  taskId: 'task-123',
});
```

### Update Task Status

Update task status with results.

```typescript
await trpc.task.updateStatus.mutate({
  taskId: 'task-123',
  status: 'completed',
  result: {
    output: 'processed data',
    metrics: { duration: 1500 },
  },
});
```

### Get Task Logs

Retrieve execution logs for a task.

```typescript
const logs = await trpc.task.getLogs.query({
  taskId: 'task-123',
  limit: 100, // optional, default 1000
});

// Response:
// {
//   id: 'log-123',
//   taskId: 'task-123',
//   agentId: 'agent-1',
//   eventType: 'execution',
//   level: 'info',
//   message: 'Task started',
//   createdAt: Date,
// }[]
```

### Get Conversation History

Retrieve agent conversation for a task.

```typescript
const messages = await trpc.task.getConversation.query({
  taskId: 'task-123',
  limit: 50, // optional, default 100
});
```

## Communication API

### Send Message

Send a message between agents.

```typescript
const message = await trpc.communication.sendMessage.mutate({
  senderId: 'agent-1',
  recipientId: 'agent-2', // optional for broadcast
  taskId: 'task-123',
  messageType: 'request', // 'request' | 'response' | 'status_update' | 'error' | 'broadcast'
  content: {
    action: 'analyze',
    data: 'data to analyze',
  },
  metadata: {
    priority: 'high',
    retryCount: 0,
  },
});
```

### Get Conversation

Retrieve message history for a task.

```typescript
const conversation = await trpc.communication.getConversation.query({
  taskId: 'task-123',
  limit: 100,
});
```

## Monitoring API

### Record Metric

Record agent performance metrics.

```typescript
await trpc.monitoring.recordMetric.mutate({
  agentId: 'agent-1',
  taskId: 'task-123',
  executionTime: 1500, // milliseconds
  tokenUsage: 500,
  estimatedCost: 0.05,
  successFlag: true,
});
```

### Get Agent Metrics

Retrieve performance metrics for an agent.

```typescript
const metrics = await trpc.monitoring.getAgentMetrics.query({
  agentId: 'agent-1',
  hoursBack: 24, // optional, default 24
});

// Response:
// {
//   agentId: 'agent-1',
//   avgExecutionTime: 1200,
//   totalTokens: 50000,
//   successRate: 98.5,
//   createdAt: Date,
// }[]
```

### Create Log

Create an execution log entry.

```typescript
await trpc.monitoring.createLog.mutate({
  taskId: 'task-123',
  agentId: 'agent-1',
  eventType: 'execution', // 'execution' | 'decision' | 'error' | 'metric' | 'state_change'
  level: 'info', // 'debug' | 'info' | 'warning' | 'error' | 'critical'
  message: 'Agent started processing',
  metadata: {
    step: 1,
    duration: 100,
  },
});
```

### Get Task Logs

Retrieve all logs for a task.

```typescript
const logs = await trpc.monitoring.getTaskLogs.query({
  taskId: 'task-123',
  limit: 1000,
});
```

## Alerts API

### Create Alert

Create an alert for critical events.

```typescript
await trpc.alerts.create.mutate({
  alertType: 'agent_failure', // 'agent_failure' | 'task_timeout' | 'system_error' | 'task_completion' | 'performance_degradation'
  severity: 'critical', // 'info' | 'warning' | 'critical'
  title: 'Agent Failed',
  message: 'Agent-1 encountered a critical error',
  relatedAgentId: 'agent-1',
  relatedTaskId: 'task-123',
});
```

### Get Unresolved Alerts

Retrieve all unresolved alerts.

```typescript
const alerts = await trpc.alerts.getUnresolved.query();

// Response:
// {
//   id: 'alert-123',
//   alertType: 'agent_failure',
//   severity: 'critical',
//   title: 'Agent Failed',
//   message: 'Error details',
//   resolved: false,
//   createdAt: Date,
// }[]
```

## Integration API

### List Integrations

Retrieve available integrations.

```typescript
const integrations = await trpc.integration.list.query({
  active: true, // optional
});

// Response:
// {
//   id: 'integration-1',
//   framework: 'langchain',
//   version: '0.1.0',
//   active: true,
// }[]
```

### Get Integration

Retrieve specific integration details.

```typescript
const integration = await trpc.integration.get.query({
  framework: 'langchain',
});
```

## LLM Provider API

### List LLM Providers

Retrieve available LLM providers.

```typescript
const providers = await trpc.llm.list.query({
  active: true, // optional
});

// Response:
// {
//   id: 'provider-1',
//   name: 'OpenAI',
//   model: 'gpt-4',
//   active: true,
// }[]
```

### Get Default LLM Provider

Retrieve the default LLM provider.

```typescript
const defaultProvider = await trpc.llm.getDefault.query();
```

## Data Types

### Agent

```typescript
interface Agent {
  id: string;
  name: string;
  type: 'reasoning' | 'execution' | 'coordination' | 'analysis';
  description?: string;
  capabilities: string[];
  status: 'active' | 'inactive' | 'error' | 'maintenance';
  llmModel?: string;
  parameters?: Record<string, unknown>;
  integrationFramework?: string;
  version?: string;
  healthScore: number;
  successRate: number;
  totalExecutions: number;
  failedExecutions: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Workflow

```typescript
interface Workflow {
  id: string;
  name: string;
  description?: string;
  orchestrationPattern: 'hierarchical' | 'sequential' | 'concurrent' | 'round_robin' | 'mesh';
  nodes: Record<string, unknown>[];
  edges: Record<string, unknown>[];
  configuration: Record<string, unknown>;
  status: 'draft' | 'active' | 'paused' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}
```

### Task

```typescript
interface Task {
  id: string;
  workflowId: string;
  input?: Record<string, unknown>;
  assignedAgents: string[];
  priority: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  result?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
```

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| BAD_REQUEST | 400 | Invalid request data |
| CONFLICT | 409 | Resource conflict |
| INTERNAL_SERVER_ERROR | 500 | Server error |
| TIMEOUT | 504 | Request timeout |

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Default**: 100 requests per minute
- **Burst**: 10 requests per second
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Pagination

List endpoints support pagination:

```typescript
const agents = await trpc.agent.list.query({
  limit: 20,
  offset: 0,
});
```

## Webhooks

Configure webhooks for event notifications:

```typescript
// Webhook events:
// - agent.created
// - agent.status_changed
// - task.completed
// - task.failed
// - workflow.started
// - workflow.completed
```

## Best Practices

1. **Error Handling** - Always handle errors gracefully
2. **Retry Logic** - Implement exponential backoff for retries
3. **Caching** - Cache frequently accessed data
4. **Pagination** - Use pagination for large result sets
5. **Monitoring** - Monitor API usage and performance
6. **Security** - Never expose API keys in client code
7. **Versioning** - Plan for API versioning strategy

## Support

For API questions and support:
- GitHub Issues: https://github.com/shards-inc/swarm-agent/issues
- Email: support@shards-inc.com
- Documentation: https://docs.swarm-agent.io

---

**Last Updated:** February 17, 2026  
**API Version:** 1.0.0  
**Status:** Stable
