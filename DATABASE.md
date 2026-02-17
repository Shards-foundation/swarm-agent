# Database Setup & Management Guide

## Overview

The Ultimate Swarm Agents Platform uses a production-grade MySQL/TiDB database to persist all swarm orchestration data, agent configurations, execution history, and monitoring metrics.

## Database Schema

### Core Tables

#### `users`
Manages platform users and authentication
- `id` (int, PK): Unique user identifier
- `openId` (varchar, UNIQUE): Manus OAuth identifier
- `name` (text): User's display name
- `email` (varchar, UNIQUE): User's email address
- `role` (enum): `user` or `admin`
- `createdAt`, `updatedAt`, `lastSignedIn` (timestamps)

#### `swarm_agents`
Registry of AI agents in the swarm
- `id` (varchar, PK): Unique agent identifier
- `userId` (int, FK): Owner user
- `name` (varchar): Agent name
- `type` (enum): `reasoning`, `execution`, `coordination`, `analysis`
- `capabilities` (json): Array of agent capabilities
- `status` (enum): `active`, `inactive`, `error`, `maintenance`
- `llmModel` (varchar): Language model used (e.g., `gpt-4`)
- `parameters` (json): Agent configuration parameters
- `healthScore` (int): 0-100 health metric
- `successRate` (decimal): Percentage of successful executions
- `totalExecutions`, `failedExecutions` (int): Execution statistics
- `lastHeartbeat` (timestamp): Last agent activity

#### `workflows`
Multi-agent orchestration patterns
- `id` (varchar, PK): Unique workflow identifier
- `userId` (int, FK): Owner user
- `name` (varchar): Workflow name
- `orchestrationPattern` (enum): `hierarchical`, `sequential`, `concurrent`, `round_robin`, `mesh`
- `nodes` (json): Array of workflow nodes
- `edges` (json): Array of connections between nodes
- `configuration` (json): Workflow-level settings
- `status` (enum): `draft`, `active`, `paused`, `archived`
- `version` (int): Workflow version number

#### `tasks`
Execution instances of workflows
- `id` (varchar, PK): Unique task identifier
- `userId` (int, FK): Owner user
- `workflowId` (varchar, FK): Associated workflow
- `input` (json): Task input parameters
- `assignedAgents` (json): Array of agent IDs assigned to task
- `priority` (int): Task priority (1-10)
- `status` (enum): `pending`, `running`, `completed`, `failed`, `timeout`
- `result` (json): Task execution result
- `executionTime` (int): Milliseconds to complete
- `startedAt`, `completedAt` (timestamps)

#### `messages`
Inter-agent communication logs
- `id` (varchar, PK): Unique message identifier
- `userId` (int, FK): Owner user
- `taskId` (varchar, FK): Associated task
- `senderId` (varchar, FK): Sending agent
- `recipientId` (varchar, FK): Receiving agent
- `messageType` (enum): `request`, `response`, `status_update`, `error`, `broadcast`
- `content` (json): Message payload
- `metadata` (json): Additional message metadata

#### `execution_logs`
Detailed execution traces and events
- `id` (varchar, PK): Unique log identifier
- `userId` (int, FK): Owner user
- `taskId` (varchar, FK): Associated task
- `agentId` (varchar, FK): Associated agent
- `eventType` (enum): `execution`, `decision`, `error`, `metric`, `state_change`
- `level` (enum): `debug`, `info`, `warning`, `error`, `critical`
- `message` (text): Log message
- `metadata` (json): Event-specific metadata

#### `metrics`
Performance and resource metrics
- `id` (varchar, PK): Unique metric identifier
- `userId` (int, FK): Owner user
- `agentId` (varchar, FK): Associated agent
- `taskId` (varchar, FK): Associated task
- `executionTime` (int): Milliseconds
- `tokenUsage` (int): LLM tokens consumed
- `estimatedCost` (decimal): Estimated API cost
- `successFlag` (boolean): Execution success indicator

#### `alerts`
Critical event notifications
- `id` (varchar, PK): Unique alert identifier
- `userId` (int, FK): Owner user
- `alertType` (enum): `agent_failure`, `task_timeout`, `system_error`, `task_completion`, `performance_degradation`
- `severity` (enum): `info`, `warning`, `critical`
- `title` (varchar): Alert title
- `message` (text): Alert description
- `relatedAgentId`, `relatedTaskId` (varchar, FK): Related resources
- `resolved` (boolean): Resolution status
- `resolvedAt` (timestamp): When alert was resolved

#### `integrations`
Framework and provider integrations
- `id` (varchar, PK): Unique integration identifier
- `userId` (int, FK): Owner user
- `framework` (varchar): Framework name (e.g., `langchain`, `crewai`)
- `version` (varchar): Integration version
- `active` (boolean): Active status
- `configuration` (json): Integration settings

#### `llm_providers`
Language model provider configurations
- `id` (varchar, PK): Unique provider identifier
- `userId` (int, FK): Owner user
- `name` (varchar): Provider name
- `provider` (enum): `openai`, `anthropic`, `ollama`, `custom`
- `model` (varchar): Model identifier
- `apiKey` (varchar): API key (encrypted in production)
- `baseUrl` (varchar): API base URL
- `active` (boolean): Active status
- `isDefault` (boolean): Default provider flag
- `configuration` (json): Provider-specific settings

#### `workflow_templates`
Pre-configured swarm architectures
- `id` (varchar, PK): Unique template identifier
- `userId` (int, FK): Owner user
- `name` (varchar): Template name
- `orchestrationPattern` (enum): Orchestration pattern
- `templateData` (json): Template configuration
- `isPublic` (boolean): Public availability flag

#### `execution_history`
Archived execution results and conversation logs
- `id` (varchar, PK): Unique history identifier
- `userId` (int, FK): Owner user
- `taskId` (varchar, FK): Associated task
- `workflowId` (varchar, FK): Associated workflow
- `input` (json): Task input
- `output` (json): Task output
- `conversationLog` (json): Agent conversation history
- `metrics` (json): Execution metrics
- `executionTime` (int): Total execution time
- `status` (enum): `completed`, `failed`, `timeout`
- `storageUrl` (varchar): S3 storage URL for large data

#### `consensus_results`
Aggregated results from multiple agents
- `id` (varchar, PK): Unique result identifier
- `userId` (int, FK): Owner user
- `taskId` (varchar, FK): Associated task
- `consensusType` (enum): `voting`, `judge_based`, `mixture_of_agents`
- `agentResults` (json): Individual agent results
- `finalResult` (json): Aggregated consensus result
- `confidence` (decimal): Confidence score (0-1)

#### `agent_configurations`
Per-agent parameter overrides
- `id` (varchar, PK): Unique configuration identifier
- `userId` (int, FK): Owner user
- `agentId` (varchar, FK): Associated agent
- `workflowId` (varchar, FK): Associated workflow
- `parameters` (json): Parameter overrides
- `llmModel` (varchar): Model override
- `systemPrompt` (text): Custom system prompt

## Database Setup

### Prerequisites
- MySQL 8.0+ or TiDB compatible database
- Database user with CREATE/ALTER/DROP privileges
- Network access to database host

### Environment Variables
```bash
DATABASE_URL=mysql://username:password@host:port/database_name
```

### Initial Setup

1. **Generate Migrations**
   ```bash
   pnpm db:push
   ```
   This generates and applies all migrations to create the schema.

2. **Seed Sample Data** (Optional)
   ```bash
   node scripts/seed-database.mjs
   ```
   Populates the database with sample agents, workflows, and test data.

## Data Persistence

### Automatic Persistence
- All API mutations automatically persist to the database
- tRPC procedures use Drizzle ORM for type-safe queries
- Transactions ensure data consistency

### Manual Queries
```typescript
import { getDb } from './server/db';

const db = await getDb();
const agents = await db.select().from(swarmAgents).where(eq(swarmAgents.userId, userId));
```

### Backup & Recovery

**Backup**
```bash
mysqldump -u username -p database_name > backup.sql
```

**Restore**
```bash
mysql -u username -p database_name < backup.sql
```

## Indexing Strategy

All tables include strategic indexes on frequently queried columns:
- User ID indexes for multi-tenancy
- Status indexes for filtering
- Type/pattern indexes for categorization
- Timestamp indexes for time-range queries

## Query Performance

### Common Queries
```typescript
// Get all agents for a user
const agents = await db.select().from(swarmAgents)
  .where(eq(swarmAgents.userId, userId));

// Get active workflows
const workflows = await db.select().from(workflows)
  .where(and(
    eq(workflows.userId, userId),
    eq(workflows.status, 'active')
  ));

// Get task execution history
const history = await db.select().from(executionHistory)
  .where(eq(executionHistory.taskId, taskId))
  .orderBy(desc(executionHistory.createdAt));

// Get agent metrics
const metrics = await db.select().from(metrics)
  .where(eq(metrics.agentId, agentId))
  .limit(100);
```

## Monitoring & Maintenance

### Health Checks
```bash
# Check database connectivity
node scripts/check-db.mjs

# Verify table structure
SHOW TABLES;
DESCRIBE swarm_agents;
```

### Performance Tuning
- Enable query caching for frequently accessed data
- Archive old execution history to cold storage
- Monitor slow query logs
- Optimize indexes based on query patterns

## Data Retention Policy

- **Execution Logs**: 90 days (then archive to S3)
- **Metrics**: 1 year
- **Alerts**: 6 months
- **Execution History**: Indefinite (archived to S3)
- **Messages**: 30 days (then purge)

## Security Considerations

1. **API Keys**: Stored encrypted in `llm_providers.apiKey`
2. **User Data**: Isolated by `userId` for multi-tenancy
3. **Sensitive Data**: Large payloads stored in S3, only URLs in database
4. **Access Control**: All queries filtered by authenticated user ID

## Troubleshooting

### Connection Issues
```bash
# Test database connection
mysql -h host -u user -p database_name -e "SELECT 1;"
```

### Migration Failures
```bash
# Clear migrations and retry
rm -rf drizzle/migrations
pnpm db:push
```

### Data Corruption
```bash
# Verify table integrity
CHECK TABLE swarm_agents;
REPAIR TABLE swarm_agents;
```

## API Integration

All database operations are exposed through tRPC procedures in `server/routers.ts`:

```typescript
// Create agent
trpc.agents.create.useMutation()

// List agents
trpc.agents.list.useQuery()

// Update workflow
trpc.workflows.update.useMutation()

// Get execution history
trpc.tasks.getHistory.useQuery()
```

See `API.md` for complete API documentation.
