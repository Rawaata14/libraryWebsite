const express = require("express");
const router = express.Router();

// register route
router.post("/register", async (req, res) => {
  try {
    const register = require("../database/queries/authorization").registerUser;
    const detailsToInsert = req.body;
    const result = await register(detailsToInsert);
    if (result.success) {
      res.status(200).json({ message: result.message });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error("Error in registration:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
