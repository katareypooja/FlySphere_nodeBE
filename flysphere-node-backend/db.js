const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/.env' });

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'FlySphere',
  password: 'Nttdata@123',
  port: '5432',
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

module.exports = pool;
