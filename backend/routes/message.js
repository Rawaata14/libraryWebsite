/*
=========================================================
message.js

תיאור הקובץ:
Routes עבור מערכת ההודעות והשיחות.

הקובץ אחראי על:
- פתיחת שיחה חדשה על ידי משתמש או אורח.
- יצירת התראה לספרניות על הודעה נכנסת.
- שליפת כל השיחות עבור הספרנית.
- שליפת שיחות המשתמש המחובר.
- שליפת שיחה מסוימת.
- שליחת תשובות בין משתמש לספרנית.
- יצירת התראה למשתמש על תשובת ספרנית.
- סימון הודעות כנקראו.
- בדיקות התחברות, הרשאות ובעלות על שיחות.
=========================================================
*/

const express = require("express");
const router = express.Router();

const messageQueries = require("../database/queries/messageQueries");
const messageService = require("../utils/messageService");
const { requireAuth, requireLibrarian } = require("../middleware/auth");

/*
---------------------------------------------------------
POST /messages

תפקיד:
פותח שיחה חדשה.

משתמש מחובר:
השם, האימייל ומזהה המשתמש נלקחים מה-Session.

אורח:
השם והאימייל נלקחים מהטופס.

לאחר שמירת ההודעה נוצרת התראה לכל
הספרניות הפעילות.
---------------------------------------------------------
*/
router.post("/", async (req, res) => {
  try {
    const result = await messageService.createNewConversation(
      req.body,
      req.session?.user || null,
    );
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Error creating message conversation:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

/*
---------------------------------------------------------
GET /messages

תפקיד:
מחזיר את כל ההודעות לספרנית בלבד.
---------------------------------------------------------
*/
router.get("/", requireLibrarian, async (req, res) => {
  try {
    const result = await messageQueries.getAllMessages();

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error getting librarian messages:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/*
---------------------------------------------------------
GET /messages/mine

תפקיד:
מחזיר למשתמש המחובר רק את השיחות השייכות לו.
---------------------------------------------------------
*/
router.get("/mine", requireAuth, async (req, res) => {
  try {
    if (req.session.user.role === "librarian") {
      return res.status(403).json({
        success: false,
        message: "This route is intended for library users",
      });
    }

    const result = await messageQueries.getMessagesByUserId(
      req.session.user.userId,
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error getting user messages:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/*
---------------------------------------------------------
GET /messages/:conversationId

תפקיד:
מחזיר את ההודעות בשיחה מסוימת.

ספרנית:
יכולה לפתוח כל שיחה.

משתמש:
יכול לפתוח רק שיחה ששייכת לו.
---------------------------------------------------------
*/
router.get("/:conversationId", requireAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const sessionUser = req.session.user;

    if (sessionUser.role !== "librarian") {
      const isOwner = await messageQueries.conversationBelongsToUser(
        conversationId,
        sessionUser.userId,
      );

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to view this conversation",
        });
      }
    }

    const result = await messageQueries.getConversationById(conversationId);

    if (result.messages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Conversation was not found",
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error getting conversation:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/*
---------------------------------------------------------
POST /messages/:conversationId/reply

תפקיד:
מוסיף תשובה לשיחה קיימת.

ספרנית:
יכולה להשיב לשיחה של משתמש רשום.
לאחר התשובה המשתמש מקבל התראה.

משתמש:
יכול להשיב רק לשיחה השייכת לו.
לאחר התשובה הספרניות מקבלות התראה.

לא ניתן להשיב לאורח מתוך האתר ללא שירות אימייל.
---------------------------------------------------------
*/
router.post("/:conversationId/reply", requireAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const result = await messageService.addReplyToConversation(
      conversationId,
      req.body,
      req.session.user,
    );
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Error replying to conversation:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

/*
---------------------------------------------------------
PUT /messages/:conversationId/read

תפקיד:
מסמן כנקראו את ההודעות שנשלחו למשתמש הנוכחי.

ספרנית:
מסמנת הודעות שנשלחו ל-librarian.

משתמש:
מסמן הודעות שנשלחו ל-reader, ורק בשיחה שלו.
---------------------------------------------------------
*/
router.put("/:conversationId/read", requireAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const sessionUser = req.session.user;

    const isLibrarian = sessionUser.role === "librarian";

    if (!isLibrarian) {
      const isOwner = await messageQueries.conversationBelongsToUser(
        conversationId,
        sessionUser.userId,
      );

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to update this conversation",
        });
      }
    }

    const recipientRole = isLibrarian ? "librarian" : "reader";

    const result = await messageQueries.markConversationAsRead(
      conversationId,
      recipientRole,
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error marking conversation as read:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
