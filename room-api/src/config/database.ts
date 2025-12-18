import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'cnweb_rooms',
  user: process.env.DB_USER || 'cnwebuser',
  password: process.env.DB_PASSWORD || 'cnwebpass',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.connect()
  .then(client => {
    console.log('Database connection pool initialized');
    client.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(-1);
  });

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

export default pool;
