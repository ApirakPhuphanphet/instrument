require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    // ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

pool.on('error', (error) => {
    console.error('Unexpected PostgreSQL pool error:', error.message);
});

module.exports = pool;
