const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'frota',
  password: '', // No password for local trust
  port: 5432,
});

module.exports = pool;
