const pool = require("../database/pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const publicUser = (user) => ({
  id: String(user.id),
  name: user.name,
  email: user.email,
  role: user.role || "HSE Manager",
  department: user.department || "Operations Division",
  organization: user.organization || "Oil India Limited (OIL)",
});

const validateCredentials = ({ name, email, password }, requireName = false) => {
  if (requireName && (typeof name !== "string" || !name.trim())) {
    return "Name is required.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email))) {
    return "A valid email is required.";
  }

  if (typeof password !== "string" || password.length < 6) {
    return "Password must be at least 6 characters long.";
  }

  return null;
};

const USER_COLUMNS = `
  id,
  name,
  email,
  role,
  department,
  organization,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

// ==================== SIGN UP ====================

const signUp = async (req, res) => {
  try {
    const { name, email, password, role, department, organization } = req.body || {};
    const normalizedEmail = normalizeEmail(email);
    const validationError = validateCredentials(
      { name, email: normalizedEmail, password },
      true
    );

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `
        INSERT INTO users (name, email, password, role, department, organization)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING ${USER_COLUMNS}
      `,
      [
        name.trim(),
        normalizedEmail,
        hashedPassword,
        role || "HSE Manager",
        department || "Operations Division",
        organization || "Oil India Limited (OIL)",
      ]
    );

    return res.status(201).json({
      success: true,
      message: "User registered successfully in PostgreSQL",
      user: publicUser(result.rows[0]),
    });
  } catch (error) {
    if (error && error.code === "23505") {
      return res.status(409).json({ success: false, message: "Email already exists in database" });
    }

    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      return res.status(503).json({
        success: false,
        message: "Database service unavailable: PostgreSQL is not connected.",
      });
    }

    return res.status(500).json({
      success: false,
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
      return res.status(400).json({ success: false, message: validationError });
    }

    let user = null;
    try {
      const result = await pool.query(
        "SELECT id, name, email, password, role, department, organization FROM users WHERE email = $1",
        [normalizedEmail]
      );
      user = result.rows[0];
    } catch (dbErr) {
      console.error("PostgreSQL user query failed:", dbErr.message);
      return res.status(503).json({
        success: false,
        message: "Authentication service unavailable: PostgreSQL database is not connected.",
        error: dbErr.message,
      });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid operational email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid operational email or password." });
    }

    const jwtSecret = process.env.JWT_SECRET || "sifguard_super_secret_jwt_key_2026";
    const token = jwt.sign(
      {
        id: String(user.id),
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: "5d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Sign in error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Authentication failed",
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
      success: true,
      users: result.rows.map(publicUser),
    });
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({ success: false, message: "PostgreSQL database unavailable" });
    }
    return res.status(500).json({ success: false, message: "Failed to get users" });
  }
};

const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, user: publicUser(result.rows[0]) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to get user" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, department } = req.body || {};
    const result = await pool.query(
      `UPDATE users SET name = COALESCE($1, name), role = COALESCE($2, role), department = COALESCE($3, department), updated_at = NOW() WHERE id = $4 RETURNING ${USER_COLUMNS}`,
      [name, role, department, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, user: publicUser(result.rows[0]) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update user" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete user" });
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
