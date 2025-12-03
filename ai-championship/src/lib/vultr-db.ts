import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.VULTR_DB_USER,
  password: process.env.VULTR_DB_PASSWORD,
  host: process.env.VULTR_DB_HOST,
  port: parseInt(process.env.VULTR_DB_PORT || '16751'),
  database: process.env.VULTR_DB_NAME,
  ssl: { rejectUnauthorized: false }
});

export async function logAnalytics(event: string, data: any) {
  try {
    const client = await pool.connect();
    await client.query(
      'INSERT INTO analytics_logs (event, data, created_at) VALUES ($1, $2, NOW())',
      [event, JSON.stringify(data)]
    );
    client.release();
  } catch (error: unknown) {
    console.error('Vultr DB log error:', error instanceof Error ? error.message : 'Unknown error');
  }
}

export { pool };
