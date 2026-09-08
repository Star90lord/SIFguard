const pool = require("../database/pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const normalizeEmail = (email) =>
    typeof email === "string" ? email.trim().toLowerCase() : "";

const publicUser = (user) => ({
    id: String(user.id),
    name: user.name,
    email: user.email,
});

const validateCredentials = ({ name, email, password }, requireName = false) => {
    if (requireName && (typeof name !== "string" || !name.trim())) {
        return "Name is required.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email))) {
        return "A valid email is required.";
    }

    if (typeof password !== "string" || password.length < 7) {
        return "Password must be at least 7 characters long.";
    }

    return null;
};

const hasJwtSecret = () =>
    typeof process.env.JWT_SECRET === "string" && process.env.JWT_SECRET.trim();

const USER_COLUMNS = `
    id,
    name,
    email,
    created_at AS "createdAt",
    updated_at AS "updatedAt"
`;

// ==================== SIGN UP ====================

const signUp = async (req, res) => {
    try {
        const { name, email, password } = req.body || {};
        const normalizedEmail = normalizeEmail(email);
        const validationError = validateCredentials(
            { name, email: normalizedEmail, password },
            true
        );

        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        const hashedPassword = await bcrypt.hash(password, 8);
        const result = await pool.query(
            `
                INSERT INTO users (name, email, password)
                VALUES ($1, $2, $3)
                RETURNING ${USER_COLUMNS}
            `,
            [name.trim(), normalizedEmail, hashedPassword]
        );

        return res.status(201).json({
            message: "User registered successfully",
            user: publicUser(result.rows[0]),
        });
    } catch (error) {
        if (error && error.code === "23505") {
            return res.status(409).json({ message: "Email already exists" });
        }

        return res.status(500).json({
            message: "Failed to register user",
            error: error.message,
        });
    }
};

// ==================== SIGN IN ====================

const signIn = async (req, res) => {
    try {
        const { email, password } = req.body || {};
        const normalizedEmail = normalizeEmail(email);
        const validationError = validateCredentials({
            email: normalizedEmail,
            password,
        });

        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        if (!hasJwtSecret()) {
            console.error("JWT_SECRET is not configured");
            return res.status(500).json({ message: "Authentication is not configured" });
        }

        const result = await pool.query(
            "SELECT id, name, email, password FROM users WHERE email = $1",
            [normalizedEmail]
        );
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({
                message: "Invalid email or password",
            });
        }

        const token = jwt.sign(
            {
                id: String(user.id),
                email: user.email,
            },
            process.env.JWT_SECRET,
            { expiresIn: "5d" }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: publicUser(user),
        });
    } catch (error) {
        return res.status(500).json({
            message: "Sign in failed",
            error: error.message,
        });
    }
};

// ==================== USER MANAGEMENT ====================

const getUsers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT ${USER_COLUMNS} FROM users ORDER BY id`
        );
        return res.status(200).json({
            users: result.rows.map(publicUser),
        });
    } catch (error) {
        return res.status(500).json({ message: "Failed to get users" });
    }
};

const getUser = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
            [req.params.id]
        );

        if (!result.rows[0]) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ user: publicUser(result.rows[0]) });
    } catch (error) {
        return res.status(400).json({ message: "Invalid user id" });
    }
};

const updateUser = async (req, res) => {
    try {
        const { name, email, password } = req.body || {};
        const fields = [];
        const values = [];

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                return res.status(400).json({ message: "Name cannot be empty" });
            }
            values.push(name.trim());
            fields.push(`name = $${values.length}`);
        }

        if (email !== undefined) {
            const normalizedEmail = normalizeEmail(email);
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
                return res.status(400).json({ message: "A valid email is required." });
            }
            values.push(normalizedEmail);
            fields.push(`email = $${values.length}`);
        }

        if (password !== undefined) {
            if (typeof password !== "string" || password.length < 7) {
                return res.status(400).json({ message: "Password must be at least 7 characters long." });
            }
            values.push(await bcrypt.hash(password, 8));
            fields.push(`password = $${values.length}`);
        }

        if (!fields.length) {
            return res.status(400).json({ message: "No valid fields to update" });
        }

        fields.push("updated_at = CURRENT_TIMESTAMP");
        values.push(req.params.id);
        const result = await pool.query(
            `
                UPDATE users
                SET ${fields.join(", ")}
                WHERE id = $${values.length}
                RETURNING ${USER_COLUMNS}
            `,
            values
        );

        if (!result.rows[0]) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            message: "User updated successfully",
            user: publicUser(result.rows[0]),
        });
    } catch (error) {
        if (error && error.code === "23505") {
            return res.status(409).json({ message: "Email already exists" });
        }
        return res.status(400).json({ message: "Unable to update user" });
    }
};

const deleteUser = async (req, res) => {
    try {
        const result = await pool.query(
            "DELETE FROM users WHERE id = $1 RETURNING id",
            [req.params.id]
        );

        if (!result.rows[0]) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        return res.status(400).json({ message: "Invalid user id" });
    }
};

module.exports = {
    signUp,
    signIn,
    getUsers,
    getUser,
    updateUser,
    deleteUser,
};
