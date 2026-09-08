const express = require("express");
const multer = require("multer");
const { connectdb } = require("./database/mongo");
const pool = require("./database/pg");
const { processDocument } = require("./services/DocumentService");

require("dotenv").config();


// ==================== APP SETUP ====================

const app = express();

// Make the document-processing pipeline available to upload routes.
// The controller awaits it after Multer has saved the uploaded file.
app.locals.processDocument = processDocument;

const PORT = process.env.PORT || 5000;


// ==================== GLOBAL MIDDLEWARE ====================

// Parse JSON request body
app.use(express.json());


// ==================== ROUTES ====================

const authRoutes = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");

// Authentication routes
// /api/auth/signup
// /api/auth/signin
// /api/auth/users
// /api/auth/users/:id

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);


// ==================== UPLOAD ERROR HANDLER ====================

app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_UNEXPECTED_FILE") {
            return res.status(400).json({
                message: 'Unexpected file field. Use the form-data key "document".',
            });
        }

        if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                message: "File is too large. Maximum size is 5 MB.",
            });
        }

        return res.status(400).json({
            message: error.message,
        });
    }

    if (error && error.message === "Only PDF files are allowed.") {
        return res.status(400).json({ message: error.message });
    }

    return next(error);
});


// ==================== HOME ROUTE ====================

app.get("/", (req, res) => {
    res.status(200).json({
        message: "DocSort API is running",
    });
});


// ==================== POSTGRES TEST ====================

app.get("/test-db", async (req, res) => {
    try {

        const result = await pool.query("SELECT NOW()");

        return res.status(200).json({
            message: "PostgreSQL connected",
            time: result.rows[0],
        });

    } catch (error) {

        console.error("POSTGRES ERROR:", error);

        return res.status(500).json({
            message: "PostgreSQL connection failed",
            error: error.message,
        });
    }
});


// ==================== 404 HANDLER ====================

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found",
    });
});


// ==================== START SERVER ====================

const startServer = async () => {

    try {

        // Connect MongoDB first
        await connectdb();

        // Ensure PostgreSQL is ready for authentication data.
        await pool.initializeAuthTable();

        console.log("MongoDB and PostgreSQL connected successfully");


        // Start Express server
        app.listen(PORT, () => {

            console.log(
                `DocSort server running on port ${PORT}`
            );

            console.log(
                `http://localhost:${PORT}`
            );
        });

    } catch (error) {

        console.error(
            "Failed to start server:",
            error.message
        );

        process.exit(1);
    }
};


startServer();
