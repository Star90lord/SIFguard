const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", "backend", ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

// ==================== POSTGRESQL CONFIG ====================

const poolConfig = process.env.SQL_URI || process.env.DATABASE_URL
  ? { connectionString: process.env.SQL_URI || process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      database: process.env.DB_NAME || "sifdb",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD,
    };

const pool = new Pool(poolConfig);

// Connection event listeners
pool.on("connect", () => {
  console.log("PostgreSQL connected successfully");
});

pool.on("error", (error) => {
  console.warn("PostgreSQL pool warning:", error.message);
});

// Test Connection helper
const testPostgresConnection = async () => {
  try {
    const result = await pool.query("SELECT NOW() AS time");
    console.log("PostgreSQL test successful:", result.rows[0].time);
    return true;
  } catch (error) {
    console.warn("PostgreSQL test warning:", error.message);
    return false;
  }
};

// Initialize Users Table
const initializeAuthTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(100) DEFAULT 'HSE Manager',
        department VARCHAR(255) DEFAULT 'Operations Division',
        organization VARCHAR(255) DEFAULT 'Oil India Limited (OIL)',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Users table initialized successfully in PostgreSQL");
  } catch (error) {
    console.warn("PostgreSQL initialization warning:", error.message);
    console.warn("Auth will continue running with development/demo fallback support.");
  }
};

// Graceful close
const closePostgresConnection = async () => {
  try {
    await pool.end();
    console.log("PostgreSQL connection closed");
  } catch (error) {
    console.warn("Error closing PostgreSQL connection:", error.message);
  }
};

pool.initializeAuthTable = initializeAuthTable;
pool.testPostgresConnection = testPostgresConnection;
pool.closePostgresConnection = closePostgresConnection;

module.exports = pool;
