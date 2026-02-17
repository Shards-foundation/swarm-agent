/**
 * Database Seed Script
 * Populates the swarm platform database with initial data for testing and development
 * 
 * Usage: node scripts/seed-database.mjs
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { nanoid } from 'nanoid';
import * as schema from '../drizzle/schema.js';

const {
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
} = schema;

// Parse database URL
function parseDatabaseUrl(url) {
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) throw new Error('Invalid DATABASE_URL format');
  
  return {
    host: match[3],
    user: match[1],
    password: match[2],
    database: match[5],
    port: parseInt(match[4]),
    ssl: 'Amazon RDS',
  };
}

// Main seed function
async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable not set');
    process.exit(1);
  }

  const config = parseDatabaseUrl(databaseUrl);
  
  try {
    console.log('🌱 Starting database seed...\n');
    
    // Create connection
    const connection = await mysql.createConnection(config);
    const db = drizzle(connection);
    
    // Create test user
    const userId = 1;
    console.log('📝 Creating test user...');
    await db.insert(users).values({
      id: userId,
      openId: 'test-user-' + nanoid(),
      name: 'Test User',
      email: 'test@example.com',
      loginMethod: 'oauth',
      role: 'admin',
    }).onDuplicateKeyUpdate({
      set: {
        name: 'Test User',
        email: 'test@example.com',
      },
    });
    
    // Create sample agents
    console.log('🤖 Creating sample agents...');
    const agentIds = [];
    const agentTypes = ['reasoning', 'execution', 'coordination', 'analysis'];
    
    for (let i = 0; i < 4; i++) {
      const agentId = 'agent-' + nanoid();
      agentIds.push(agentId);
      
      await db.insert(swarmAgents).values({
        id: agentId,
        userId,
        name: `${agentTypes[i].charAt(0).toUpperCase() + agentTypes[i].slice(1)} Agent ${i + 1}`,
        type: agentTypes[i],
        description: `Sample ${agentTypes[i]} agent for testing`,
        capabilities: JSON.stringify(['analysis', 'reasoning', 'decision_making']),
        status: 'active',
        llmModel: 'gpt-4',
        parameters: JSON.stringify({ temperature: 0.7, maxTokens: 2000 }),
        integrationFramework: 'langchain',
        version: '1.0.0',
        healthScore: 100,
        successRate: 100,
        totalExecutions: 0,
        failedExecutions: 0,
      });
    }
    console.log(`✓ Created ${agentIds.length} agents`);
    
    // Create sample workflows
    console.log('🔄 Creating sample workflows...');
    const workflowIds = [];
    const patterns = ['sequential', 'concurrent', 'hierarchical', 'round_robin'];
    
    for (let i = 0; i < 4; i++) {
      const workflowId = 'workflow-' + nanoid();
      workflowIds.push(workflowId);
      
      const nodes = agentIds.map((agentId, idx) => ({
        id: `node-${idx}`,
        type: 'agent',
        agentId,
      }));
      
      const edges = [];
      for (let j = 0; j < nodes.length - 1; j++) {
        edges.push({
          source: `node-${j}`,
          target: `node-${j + 1}`,
        });
      }
      
      await db.insert(workflows).values({
        id: workflowId,
        userId,
        name: `${patterns[i].charAt(0).toUpperCase() + patterns[i].slice(1)} Workflow`,
        description: `Sample ${patterns[i]} workflow for testing`,
        orchestrationPattern: patterns[i],
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
        configuration: JSON.stringify({ timeout: 3600, maxRetries: 3 }),
        status: 'active',
        version: 1,
      });
    }
    console.log(`✓ Created ${workflowIds.length} workflows`);
    
    // Create sample tasks
    console.log('📋 Creating sample tasks...');
    const taskIds = [];
    
    for (let i = 0; i < 3; i++) {
      const taskId = 'task-' + nanoid();
      taskIds.push(taskId);
      
      await db.insert(tasks).values({
        id: taskId,
        userId,
        workflowId: workflowIds[i % workflowIds.length],
        input: JSON.stringify({ query: `Test query ${i + 1}`, data: 'sample data' }),
        assignedAgents: JSON.stringify(agentIds.slice(0, 2)),
        priority: i + 1,
        status: i === 0 ? 'completed' : i === 1 ? 'running' : 'pending',
        result: i === 0 ? JSON.stringify({ output: 'test result' }) : JSON.stringify({}),
        executionTime: i === 0 ? 1500 : null,
        startedAt: i > 0 ? new Date() : null,
        completedAt: i === 0 ? new Date() : null,
      });
    }
    console.log(`✓ Created ${taskIds.length} tasks`);
    
    // Create sample messages
    console.log('💬 Creating sample messages...');
    for (let i = 0; i < 5; i++) {
      const messageId = 'msg-' + nanoid();
      
      await db.insert(messages).values({
        id: messageId,
        userId,
        taskId: taskIds[0],
        senderId: agentIds[0],
        recipientId: agentIds[1],
        messageType: ['request', 'response', 'status_update'][i % 3],
        content: JSON.stringify({ action: 'analyze', data: `message ${i + 1}` }),
        metadata: JSON.stringify({ priority: 'high', retryCount: 0 }),
      });
    }
    console.log('✓ Created 5 messages');
    
    // Create sample execution logs
    console.log('📊 Creating sample execution logs...');
    for (let i = 0; i < 10; i++) {
      const logId = 'log-' + nanoid();
      
      await db.insert(executionLogs).values({
        id: logId,
        userId,
        taskId: taskIds[0],
        agentId: agentIds[i % agentIds.length],
        eventType: ['execution', 'decision', 'error'][i % 3],
        level: ['info', 'warning', 'error'][i % 3],
        message: `Execution event ${i + 1}`,
        metadata: JSON.stringify({ step: i + 1, duration: Math.random() * 1000 }),
      });
    }
    console.log('✓ Created 10 execution logs');
    
    // Create sample metrics
    console.log('📈 Creating sample metrics...');
    for (let i = 0; i < 8; i++) {
      const metricId = 'metric-' + nanoid();
      
      await db.insert(metrics).values({
        id: metricId,
        userId,
        agentId: agentIds[i % agentIds.length],
        taskId: taskIds[0],
        executionTime: Math.floor(Math.random() * 5000) + 500,
        tokenUsage: Math.floor(Math.random() * 2000) + 100,
        estimatedCost: (Math.random() * 0.1).toFixed(6),
        successFlag: Math.random() > 0.2,
      });
    }
    console.log('✓ Created 8 metrics');
    
    // Create sample alerts
    console.log('🚨 Creating sample alerts...');
    const alertTypes = ['agent_failure', 'task_timeout', 'system_error', 'task_completion'];
    
    for (let i = 0; i < 4; i++) {
      const alertId = 'alert-' + nanoid();
      
      await db.insert(alerts).values({
        id: alertId,
        userId,
        alertType: alertTypes[i],
        severity: i === 0 ? 'critical' : i === 1 ? 'warning' : 'info',
        title: `Alert: ${alertTypes[i].replace(/_/g, ' ')}`,
        message: `Sample alert message for ${alertTypes[i]}`,
        relatedAgentId: agentIds[i % agentIds.length],
        relatedTaskId: taskIds[0],
        resolved: i > 1,
      });
    }
    console.log('✓ Created 4 alerts');
    
    // Create sample integrations
    console.log('🔌 Creating sample integrations...');
    const frameworks = ['langchain', 'crewai', 'autogpt', 'haystack'];
    
    for (const framework of frameworks) {
      const integrationId = 'integration-' + nanoid();
      
      await db.insert(integrations).values({
        id: integrationId,
        userId,
        framework,
        version: '0.1.0',
        active: true,
        configuration: JSON.stringify({ apiKey: 'sample-key', baseUrl: 'https://api.example.com' }),
      });
    }
    console.log(`✓ Created ${frameworks.length} integrations`);
    
    // Create sample LLM providers
    console.log('🧠 Creating sample LLM providers...');
    const providers = [
      { name: 'OpenAI GPT-4', provider: 'openai', model: 'gpt-4' },
      { name: 'Anthropic Claude', provider: 'anthropic', model: 'claude-3-opus' },
      { name: 'Ollama Local', provider: 'ollama', model: 'mistral' },
    ];
    
    for (let i = 0; i < providers.length; i++) {
      const providerId = 'llm-' + nanoid();
      
      await db.insert(llmProviders).values({
        id: providerId,
        userId,
        name: providers[i].name,
        provider: providers[i].provider,
        model: providers[i].model,
        apiKey: 'sample-api-key',
        baseUrl: 'https://api.example.com',
        active: true,
        isDefault: i === 0,
        configuration: JSON.stringify({ temperature: 0.7, maxTokens: 2000 }),
      });
    }
    console.log(`✓ Created ${providers.length} LLM providers`);
    
    // Create sample workflow templates
    console.log('📋 Creating sample workflow templates...');
    const templatePatterns = ['hierarchical', 'sequential', 'concurrent', 'round_robin'];
    
    for (const pattern of templatePatterns) {
      const templateId = 'template-' + nanoid();
      
      await db.insert(workflowTemplates).values({
        id: templateId,
        userId,
        name: `${pattern.charAt(0).toUpperCase() + pattern.slice(1)} Template`,
        description: `Pre-configured ${pattern} workflow template`,
        category: 'orchestration',
        orchestrationPattern: pattern,
        templateData: JSON.stringify({ nodes: [], edges: [], config: {} }),
        isPublic: false,
      });
    }
    console.log(`✓ Created ${templatePatterns.length} workflow templates`);
    
    // Create sample execution history
    console.log('📚 Creating sample execution history...');
    for (let i = 0; i < 3; i++) {
      const historyId = 'history-' + nanoid();
      
      await db.insert(executionHistory).values({
        id: historyId,
        userId,
        taskId: taskIds[i],
        workflowId: workflowIds[i % workflowIds.length],
        input: JSON.stringify({ query: `Historical query ${i + 1}` }),
        output: JSON.stringify({ result: `Historical result ${i + 1}` }),
        conversationLog: JSON.stringify([
          { agent: 'agent-1', message: 'Starting analysis' },
          { agent: 'agent-2', message: 'Processing data' },
        ]),
        metrics: JSON.stringify({ duration: 2000, tokens: 500 }),
        executionTime: 2000,
        status: 'completed',
        storageUrl: 'https://s3.example.com/history/' + historyId,
      });
    }
    console.log('✓ Created 3 execution history records');
    
    // Create sample consensus results
    console.log('🤝 Creating sample consensus results...');
    for (let i = 0; i < 2; i++) {
      const consensusId = 'consensus-' + nanoid();
      
      await db.insert(consensusResults).values({
        id: consensusId,
        userId,
        taskId: taskIds[0],
        consensusType: i === 0 ? 'voting' : 'judge_based',
        agentResults: JSON.stringify([
          { agentId: agentIds[0], result: 'option-a', confidence: 0.9 },
          { agentId: agentIds[1], result: 'option-a', confidence: 0.85 },
        ]),
        finalResult: JSON.stringify({ decision: 'option-a', reasoning: 'Majority consensus' }),
        confidence: (0.87).toFixed(4),
      });
    }
    console.log('✓ Created 2 consensus results');
    
    // Create sample agent configurations
    console.log('⚙️ Creating sample agent configurations...');
    for (let i = 0; i < 2; i++) {
      const configId = 'config-' + nanoid();
      
      await db.insert(agentConfigurations).values({
        id: configId,
        userId,
        agentId: agentIds[i],
        workflowId: workflowIds[0],
        parameters: JSON.stringify({ temperature: 0.7, topP: 0.9 }),
        llmModel: 'gpt-4',
        systemPrompt: 'You are a helpful AI assistant specialized in data analysis.',
      });
    }
    console.log('✓ Created 2 agent configurations');
    
    await connection.end();
    
    console.log('\n✅ Database seed completed successfully!');
    console.log('\nSummary:');
    console.log(`  - 1 user created`);
    console.log(`  - ${agentIds.length} agents created`);
    console.log(`  - ${workflowIds.length} workflows created`);
    console.log(`  - ${taskIds.length} tasks created`);
    console.log(`  - 5 messages created`);
    console.log(`  - 10 execution logs created`);
    console.log(`  - 8 metrics created`);
    console.log(`  - 4 alerts created`);
    console.log(`  - ${frameworks.length} integrations created`);
    console.log(`  - ${providers.length} LLM providers created`);
    console.log(`  - ${templatePatterns.length} workflow templates created`);
    console.log(`  - 3 execution history records created`);
    console.log(`  - 2 consensus results created`);
    console.log(`  - 2 agent configurations created`);
    
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
}

// Run seed
seed();
