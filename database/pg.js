const { Pool } = require("pg");
require("dotenv").config();

// ==================== POSTGRESQL CONFIG ====================

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || "sifdb",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD,
});

// ==================== CHECK CONFIG ====================

console.log("PostgreSQL configuration:");
console.log("Host:", process.env.DB_HOST || "localhost");
console.log("Port:", process.env.DB_PORT || 5432);
console.log("Database:", process.env.DB_NAME || "sifdb");
console.log("User:", process.env.DB_USER || "postgres");
console.log("Password loaded:", !!process.env.DB_PASSWORD);

// ==================== CONNECTION ====================

pool.on("connect", () => {
    console.log("PostgreSQL connected successfully");
});

pool.on("error", (error) => {
    console.error("PostgreSQL pool error:", error.message);
});

// ==================== TEST CONNECTION ====================

const testPostgresConnection = async () => {
    try {
        const result = await pool.query("SELECT NOW() AS time");

        console.log(
            "PostgreSQL test successful:",
            result.rows[0].time
        );

        return true;
    } catch (error) {
        console.error(
            "PostgreSQL test failed:",
            error.message
        );

        throw error;
    }
};

// ==================== INITIALIZE USERS TABLE ====================

const initializeAuthTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id BIGSERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("Users table initialized successfully");

    } catch (error) {
        console.error(
            "Failed to initialize users table:",
            error.message
        );

        throw error;
    }
};

// ==================== CLOSE CONNECTION ====================

const closePostgresConnection = async () => {
    try {
        await pool.end();
        console.log("PostgreSQL connection closed");
    } catch (error) {
        console.error(
            "Error closing PostgreSQL connection:",
            error.message
        );
    }
};

// ==================== GRACEFUL SHUTDOWN ====================

process.on("SIGINT", async () => {
    await closePostgresConnection();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    await closePostgresConnection();
    process.exit(0);
});

// ==================== EXPORT ====================

module.exports = pool;

module.exports.testPostgresConnection =
    testPostgresConnection;

module.exports.initializeAuthTable =
    initializeAuthTable;

module.exports.closePostgresConnection =
    closePostgresConnection;