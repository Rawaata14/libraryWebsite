const express = require("express");
const router = express.Router();
// const authQueries = require("../database/queries/authorization");

// Route for user registration
router.post("/register", async (req, res) => {
  try {
    const register = require("../database/queries/authorization").registerUser;
    const detailsToInsert = req.body;
    const result = await register(detailsToInsert);
    if (result.success) {
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
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
