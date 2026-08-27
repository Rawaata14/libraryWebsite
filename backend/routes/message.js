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
const { randomUUID } = require("crypto");

const router = express.Router();

const messageQueries = require("../database/queries/messageQueries");

const notificationQueries = require("../database/queries/notificationQueries");

const { requireAuth, requireLibrarian } = require("../middleware/auth");

/*
---------------------------------------------------------
normalizeText

תפקיד:
מנקה ערך טקסט שהתקבל בבקשה.
---------------------------------------------------------
*/
function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/*
---------------------------------------------------------
isValidEmail

תפקיד:
מבצע בדיקה בסיסית של כתובת אימייל.
---------------------------------------------------------
*/
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/*
---------------------------------------------------------
getSessionUserName

תפקיד:
מחזיר את שם המשתמש מתוך ה-Session.
---------------------------------------------------------
*/
function getSessionUserName(user) {
  return user?.fullName || user?.name || "Library User";
}

/*
---------------------------------------------------------
notifyActiveLibrarians

תפקיד:
שולחת התראה לכל הספרניות הפעילות.

כישלון ביצירת ההתראה אינו מבטל הודעה שכבר
נשמרה בהצלחה.
---------------------------------------------------------
*/
async function notifyActiveLibrarians(message, type) {
  const notificationResult =
    await notificationQueries.addNotificationToActiveLibrarians(message, type);

  if (!notificationResult.success) {
    console.error(
      "Message was saved, but librarian notification creation failed.",
    );

    return;
  }

  if (notificationResult.notifiedLibrarians === 0) {
    console.warn("Message was saved, but no active librarians were found.");
  }
}

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
    const subject = normalizeText(req.body.subject);

    const messageText = normalizeText(req.body.messageText);

    if (!subject || !messageText) {
      return res.status(400).json({
        success: false,
        message: "Subject and message are required",
      });
    }

    if (subject.length > 150) {
      return res.status(400).json({
        success: false,
        message: "Subject must contain no more than 150 characters",
      });
    }

    if (messageText.length > 3000) {
      return res.status(400).json({
        success: false,
        message: "Message must contain no more than 3000 characters",
      });
    }

    const sessionUser = req.session?.user || null;

    /*
    ספרנית אינה צריכה לפתוח פנייה לעצמה דרך
    טופס Contact.
    */
    if (sessionUser?.role === "librarian") {
      return res.status(400).json({
        success: false,
        message: "Librarians should reply through the messages page",
      });
    }

    let userId = null;
    let senderName;
    let senderEmail;
    let senderRole = "guest";

    if (sessionUser) {
      userId = sessionUser.userId;

      senderName = getSessionUserName(sessionUser);

      senderEmail = normalizeText(sessionUser.email);

      senderRole = "reader";
    } else {
      senderName = normalizeText(req.body.senderName);

      senderEmail = normalizeText(req.body.senderEmail);

      if (!senderName || !senderEmail) {
        return res.status(400).json({
          success: false,
          message: "Name and email are required for guests",
        });
      }

      if (senderName.length > 100) {
        return res.status(400).json({
          success: false,
          message: "Name must contain no more than 100 characters",
        });
      }

      if (senderEmail.length > 100) {
        return res.status(400).json({
          success: false,
          message: "Email must contain no more than 100 characters",
        });
      }

      if (!isValidEmail(senderEmail)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid email address",
        });
      }
    }

    if (!senderEmail) {
      return res.status(400).json({
        success: false,
        message: "The user account does not contain an email address",
      });
    }

    const conversationId = randomUUID();

    const result = await messageQueries.addMessage({
      conversationId,
      userId,
      senderName,
      senderEmail,
      senderRole,
      recipientRole: "librarian",
      subject,
      messageText,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    /*
    -------------------------------------------------------
    יצירת התראה לספרניות

    סוג ההתראה שונה בין משתמש רשום לאורח,
    כדי שניתן יהיה להבחין ביניהם בדף ההתראות.
    -------------------------------------------------------
    */
    const notificationType =
      senderRole === "guest" ? "new_guest_message" : "new_reader_message";

    const notificationMessage =
      senderRole === "guest"
        ? `New guest inquiry from ${senderName}: ${subject}`
        : `New message from ${senderName}: ${subject}`;

    await notifyActiveLibrarians(notificationMessage, notificationType);

    return res.status(201).json(result);
  } catch (error) {
    console.error("Error creating message conversation:", error);

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

    const sessionUser = req.session.user;

    const messageText = normalizeText(req.body.messageText);

    if (!messageText) {
      return res.status(400).json({
        success: false,
        message: "Reply message is required",
      });
    }

    if (messageText.length > 3000) {
      return res.status(400).json({
        success: false,
        message: "Reply must contain no more than 3000 characters",
      });
    }

    const conversation =
      await messageQueries.getConversationDetails(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation was not found",
      });
    }

    const isLibrarian = sessionUser.role === "librarian";

    if (!isLibrarian) {
      const isOwner = await messageQueries.conversationBelongsToUser(
        conversationId,
        sessionUser.userId,
      );

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to reply to this conversation",
        });
      }
    }

    /*
      לא מאפשרים תשובה פנימית לאורח,
      משום שאין לו עמוד הודעות באתר.
      */
    if (isLibrarian && !conversation.userId) {
      return res.status(400).json({
        success: false,
        message:
          "Guest replies require an email service, which is not configured",
      });
    }

    const result = await messageQueries.addMessage({
      conversationId,
      userId: conversation.userId,
      senderName: getSessionUserName(sessionUser),
      senderEmail: normalizeText(sessionUser.email),
      senderRole: isLibrarian ? "librarian" : "reader",
      recipientRole: isLibrarian ? "reader" : "librarian",
      subject: conversation.subject,
      messageText,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    /*
      -----------------------------------------------------
      יצירת התראה לאחר תשובה

      תשובת ספרנית:
      נשלחת התראה למשתמש בעל השיחה.

      תשובת משתמש:
      נשלחת התראה לכל הספרניות הפעילות.
      -----------------------------------------------------
      */
    if (isLibrarian) {
      const notificationResult = await notificationQueries.addNotification(
        conversation.userId,
        `New reply from the library: ${conversation.subject}`,
        "librarian_reply",
      );

      if (!notificationResult.success) {
        console.error(
          "Reply was saved, but user notification creation failed.",
        );
      }
    } else {
      const senderName = getSessionUserName(sessionUser);

      await notifyActiveLibrarians(
        `New reply from ${senderName}: ${conversation.subject}`,
        "reader_message_reply",
      );
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error("Error replying to conversation:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
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
