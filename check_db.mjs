import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;

if (!url) {
  console.log('DATABASE_URL not set');
  process.exit(1);
}

const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
if (!match) {
  console.log('Invalid DATABASE_URL format');
  process.exit(1);
}

const config = {
  host: match[3],
  user: match[1],
  password: match[2],
  database: match[5],
  port: parseInt(match[4]),
  ssl: 'Amazon RDS',
};

(async () => {
  try {
    const connection = await mysql.createConnection(config);
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('✓ Database Connected Successfully');
    console.log('\nExisting Tables:');
    tables.forEach(row => {
      const tableName = Object.values(row)[0];
      console.log('  -', tableName);
    });
    await connection.end();
  } catch (error) {
    console.error('✗ Database Error:', error.message);
    process.exit(1);
  }
})();
