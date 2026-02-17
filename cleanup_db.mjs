import { drizzle } from 'drizzle-orm/mysql2';
import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function cleanup() {
  const connection = await createConnection(process.env.DATABASE_URL);
  
  const tables = [
    'llm_providers',
    'integration_modules',
    'system_alerts',
    'agent_metrics',
    'workflow_templates',
    'orchestration_configs',
    'execution_logs',
    'agent_messages',
    'tasks',
    'workflows',
    'agents',
    'users',
  ];

  for (const table of tables) {
    try {
      await connection.execute(`DROP TABLE IF EXISTS \`${table}\``);
      console.log(`✓ Dropped ${table}`);
    } catch (error) {
      console.error(`✗ Error dropping ${table}:`, error.message);
    }
  }

  await connection.end();
  console.log('\n✓ Database cleanup complete');
}

cleanup().catch(console.error);
