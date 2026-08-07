/*
=========================================================
notificationQueries.js

תיאור הקובץ:
שאילתות לניהול התראות המשתמשים במערכת.

הקובץ כולל:
- יצירת התראה חדשה.
- שליפת התראות של משתמש מסוים.
- סימון התראה אחת כנקראה.
- סימון כל התראות המשתמש כנקראו.
=========================================================
*/

const doQuery = require("../query");

/*
---------------------------------------------------------
addNotification

תפקיד:
יוצרת התראה חדשה עבור משתמש מסוים.

פרמטרים:
- userId: מזהה המשתמש שמקבל את ההתראה.
- message: תוכן ההתראה.
- type: סוג ההתראה.
---------------------------------------------------------
*/
async function addNotification(userId, message, type) {
  try {
    const sql = `
      INSERT INTO notification
        (userId, message, type, isRead)
      VALUES (?, ?, ?, 0)
    `;

    const result = await doQuery(sql, [userId, message, type]);

    return {
      success: result.affectedRows > 0,
      notificationId: result.insertId,
    };
  } catch (error) {
    console.error("Error creating notification:", error);

    return {
      success: false,
      message: "Failed to create notification",
    };
  }
}

/*
---------------------------------------------------------
getNotificationsByUser

תפקיד:
שולפת את כל ההתראות השייכות למשתמש המחובר.

ההתראות מוחזרות מהחדשה לישנה.
---------------------------------------------------------
*/
async function getNotificationsByUser(userId) {
  try {
    const sql = `
      SELECT
        notificationId,
        userId,
        message,
        sentDate,
        type,
        isRead
      FROM notification
      WHERE userId = ?
      ORDER BY sentDate DESC, notificationId DESC
    `;

    const notifications = await doQuery(sql, [userId]);

    return {
      success: true,
      notifications,
    };
  } catch (error) {
    console.error("Error fetching user notifications:", error);

    return {
      success: false,
      message: "Failed to fetch notifications",
      notifications: [],
    };
  }
}

/*
---------------------------------------------------------
markNotificationAsRead

תפקיד:
מסמנת התראה אחת כנקראה.

בדיקת userId מבטיחה שמשתמש אינו יכול
לסמן התראה השייכת למשתמש אחר.
---------------------------------------------------------
*/
async function markNotificationAsRead(notificationId, userId) {
  try {
    const sql = `
      UPDATE notification
      SET isRead = 1
      WHERE notificationId = ?
        AND userId = ?
    `;

    const result = await doQuery(sql, [notificationId, userId]);

    if (result.affectedRows === 0) {
      return {
        success: false,
        notFound: true,
        message: "Notification not found",
      };
    }

    return {
      success: true,
      message: "Notification marked as read",
    };
  } catch (error) {
    console.error("Error marking notification as read:", error);

    return {
      success: false,
      message: "Failed to update notification",
    };
  }
}

/*
---------------------------------------------------------
markAllNotificationsAsRead

תפקיד:
מסמנת את כל ההתראות של המשתמש כנקראו.
---------------------------------------------------------
*/
async function markAllNotificationsAsRead(userId) {
  try {
    const sql = `
      UPDATE notification
      SET isRead = 1
      WHERE userId = ?
        AND isRead = 0
    `;

    const result = await doQuery(sql, [userId]);

    return {
      success: true,
      updatedNotifications: result.affectedRows,
      message: "All notifications marked as read",
    };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);

    return {
      success: false,
      message: "Failed to update notifications",
    };
  }
}

module.exports = {
  addNotification,
  getNotificationsByUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
