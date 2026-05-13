const express = require("express");
const session = require("express-session");
const router = express.Router();
// const authQueries = require("../database/queries/authorization");

// Route for user registration
router.post("/register", async (req, res) => {
  try {
    const register = require("../database/queries/authorization").registerUser;
    const detailsToInsert = req.body;
    const result = await register(detailsToInsert);
    if (result.success) {
      req.session.user = result.user;
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in registration:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route for user login
router.post("/login", async (req, res) => {
  try {
    const login = require("../database/queries/authorization").loginUser;
    const { email, password } = req.body;
    const result = await login(email, password);
    if (result.success) {
      req.session.user = result.user; // שמירת פרטי המשתמש בסשן
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route for checking authentication status
router.get("/check-auth", async (req, res) => {
  try {
    if (req.session && req.session.user) {
      res.status(200).json(req.session.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  } catch (error) {
    console.error("Error in checking authentication:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route for user logout
router.post("/logout", (req, res) => {
  try {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error in logout:", err);
          return res.status(500).json({ message: "Internal server error" });
        }
        res.clearCookie("connect.sid");
        res.status(200).json({ message: "Logged out successfully" });
      });
    } else {
      res.status(400).json({ message: "No active session" });
    }
  } catch (error) {
    console.error("Error in logout:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
