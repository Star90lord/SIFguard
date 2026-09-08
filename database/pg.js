const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

pool.on("connect", () => {
    console.log("PostgreSQL connected successfully");
});

pool.on("error", (error) => {
    console.error("PostgreSQL connection error:", error);
});

const initializeAuthTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id BIGSERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);
};

// Graceful shutdown
process.on("SIGINT", async () => {
    console.log("\nShutting down PostgreSQL connection...");

    await pool.end();

    console.log("PostgreSQL connection closed.");
    process.exit(0);
});

process.on("SIGTERM", async () => {
    console.log("\nShutting down PostgreSQL connection...");

    await pool.end();

    console.log("PostgreSQL connection closed.");
    process.exit(0);
});

module.exports = pool;
module.exports.initializeAuthTable = initializeAuthTable;
