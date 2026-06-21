const express = require("express");
const router = express.Router();

const messageQueries = require("../database/queries/messageQueries");

/*
---------------------------------------------------------
POST /messages

תפקיד:
שמירת הודעה חדשה שנשלחה מטופס Contact.
---------------------------------------------------------
*/
router.post("/", async (req, res) => {
  try {
    const result = await messageQueries.addMessage(req.body);

    if (result.success) {
      return res.status(201).json(result);
    }

    return res.status(400).json(result);
  } catch (error) {
    console.error("Error adding message:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/*
---------------------------------------------------------
GET /messages

תפקיד:
שליפת כל ההודעות עבור הספרן.
---------------------------------------------------------
*/
router.get("/", async (req, res) => {
  try {
    const result = await messageQueries.getAllMessages();

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error getting messages:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/*
---------------------------------------------------------
PUT /messages/:id/read

תפקיד:
סימון הודעה כנקראה.
---------------------------------------------------------
*/
router.put("/:id/read", async (req, res) => {
  try {
    const result = await messageQueries.markMessageAsRead(req.params.id);

    if (result.success) {
      return res.status(200).json(result);
    }

    return res.status(400).json(result);
  } catch (error) {
    console.error("Error marking message as read:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
