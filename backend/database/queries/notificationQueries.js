/*
=========================================================
notificationQueries.js

תיאור הקובץ:
שאילתות לניהול התראות במערכת.
=========================================================
*/

const doQuery = require("../query");

/*
---------------------------------------------------------
addNotification

תפקיד:
יצירת התראה חדשה למשתמש.
---------------------------------------------------------
*/
async function addNotification(userId, message, type) {
  try {
    const sql =
      "INSERT INTO notification (userId, message, type, isRead) VALUES (?, ?, ?, 0)";

    const result = await doQuery(sql, [userId, message, type]);

    return {
      success: result.affectedRows > 0,
    };
  } catch (error) {
    console.error("Error creating notification:", error);

    return {
      success: false,
    };
  }
}

module.exports = {
  addNotification,
};
