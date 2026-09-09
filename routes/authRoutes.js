const express = require("express");

const router = express.Router();

const {
    signUp,
    signIn,
    getUsers,
    getUser,
    updateUser,
    deleteUser,
} = require("../controller/authController");

const authMiddleware = require("../middleware/authMiddleware");


// ==================== PUBLIC ROUTES ====================

// Signup
// POST /api/auth/signup
router.post("/signup", signUp);


// Signin
// POST /api/auth/signin
router.post("/signin", signIn);


// Login alias (same handler; used by Postman flow)
// POST /api/auth/login
router.post("/login", signIn);


// ==================== PROTECTED ROUTES ====================

// Get all users
// GET /api/auth/users
router.get("/users", authMiddleware, getUsers);


// Get one user
// GET /api/auth/users/:id
router.get("/users/:id", authMiddleware, getUser);


// Update user
// PUT /api/auth/users/:id
router.put("/users/:id", authMiddleware, updateUser);


// Update user
// PATCH /api/auth/users/:id
router.patch("/users/:id", authMiddleware, updateUser);


// Delete user
// DELETE /api/auth/users/:id
router.delete("/users/:id", authMiddleware, deleteUser);


module.exports = router;
