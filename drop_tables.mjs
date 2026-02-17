import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

const url = process.env.DATABASE_URL;
const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);

if (!match) {
  console.error('Invalid DATABASE_URL');
  process.exit(1);
}

const [, user, password, host, port, database] = match;

const connection = await mysql.createConnection({
  host,
  port: parseInt(port),
  user,
  password,
  database,
});

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
    await connection.execute(`DROP TABLE IF EXISTS ${table}`);
    console.log(`✓ Dropped ${table}`);
  } catch (error) {
    console.error(`✗ Error dropping ${table}:`, error.message);
  }
}

await connection.end();
console.log('\n✓ All tables dropped successfully');
