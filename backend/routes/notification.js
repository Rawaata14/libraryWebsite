/*
=========================================================
notification.js

תיאור הקובץ:
Routes לניהול התראות המשתמש המחובר.

הקובץ כולל:
- שליפת התראות המשתמש.
- סימון התראה כנקראה.
- סימון כל ההתראות כנקראו.
=========================================================
*/

const express = require("express");
const router = express.Router();

const notificationQueries = require("../database/queries/notificationQueries");

/*
---------------------------------------------------------
GET /notifications

תפקיד:
מחזיר את כל ההתראות של המשתמש המחובר.

ה-userId נלקח מה-session ולא מה-Frontend,
כדי למנוע גישה להתראות של משתמש אחר.
---------------------------------------------------------
*/
router.get("/", async (req, res) => {
  try {
    if (!req.session?.user) {
      return res.status(401).json({
        success: false,
        message: "User is not authenticated",
      });
    }

    const result = await notificationQueries.getNotificationsByUser(
      req.session.user.userId,
    );

    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("Error loading notifications:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/*
---------------------------------------------------------
PATCH /notifications/:notificationId/read

תפקיד:
מסמן התראה אחת של המשתמש המחובר כנקראה.
---------------------------------------------------------
*/
router.patch("/:notificationId/read", async (req, res) => {
  try {
    if (!req.session?.user) {
      return res.status(401).json({
        success: false,
        message: "User is not authenticated",
      });
    }

    const notificationId = Number(req.params.notificationId);

    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const result = await notificationQueries.markNotificationAsRead(
      notificationId,
      req.session.user.userId,
    );

    if (result.notFound) {
      return res.status(404).json(result);
    }

    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("Error marking notification as read:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/*
---------------------------------------------------------
PATCH /notifications/read-all

תפקיד:
מסמן את כל ההתראות של המשתמש המחובר כנקראו.

הנתיב חייב להופיע לפני נתיבים כלליים יותר
אם בעתיד יתווספו נתיבי PATCH דומים.
---------------------------------------------------------
*/
router.patch("/read-all", async (req, res) => {
  try {
    if (!req.session?.user) {
      return res.status(401).json({
        success: false,
        message: "User is not authenticated",
      });
    }

    const result = await notificationQueries.markAllNotificationsAsRead(
      req.session.user.userId,
    );

    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("Error marking all notifications as read:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
