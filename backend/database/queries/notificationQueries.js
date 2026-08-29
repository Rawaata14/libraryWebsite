/*
=========================================================
notificationQueries.js

תיאור הקובץ:
שאילתות לניהול התראות במערכת.

הקובץ כולל:
- יצירת התראה למשתמש מסוים.
- יצירת התראה לכל הספרניות הפעילות.
- התראה לספרניות על ביטול הזמנה של אותו יום.
- שליפת התראות.
- סימון התראות כנקראו.
=========================================================
*/

const doQuery = require("../query");

/*
---------------------------------------------------------
addNotification

תפקיד:
יוצרת התראה עבור משתמש מסוים.
---------------------------------------------------------
*/
async function addNotification(userId, message, type) {
  try {
    const sql = `
      INSERT INTO notification
        (
          userId,
          message,
          type,
          isRead
        )
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
addNotificationToActiveLibrarians

תפקיד:
יוצרת התראה זהה עבור כל הספרניות הפעילות.

השימושים כוללים:
- הודעה חדשה ממשתמש רשום.
- הודעה חדשה מאורח.
- תשובה חדשה של משתמש בשיחה.
---------------------------------------------------------
*/
async function addNotificationToActiveLibrarians(message, type) {
  try {
    const sql = `
      INSERT INTO notification
        (
          userId,
          message,
          type,
          isRead
        )
      SELECT
        userId,
        ?,
        ?,
        0
      FROM user
      WHERE LOWER(role) = 'librarian'
        AND LOWER(status) = 'active'
    `;

    const result = await doQuery(sql, [message, type]);

    return {
      success: true,
      createdNotifications: result.affectedRows,
    };
  } catch (error) {
    console.error("Error notifying active librarians:", error);

    return {
      success: false,
      message: "Failed to notify active librarians",
    };
  }
}

/*
---------------------------------------------------------
addTodayCancellationNotificationToLibrarians

תפקיד:
יוצרת התראה לכל הספרניות הפעילות כאשר משתמש
מבטל הזמנה המתקיימת היום.

הפרמטר reservationDate מתקבל מהשרת לאחר שכבר
חושב לפי Asia/Jerusalem.

כך אין תלות ב-CURDATE של MySQL, שעלול לפעול
לפי UTC ולהחזיר יום שונה סמוך לחצות.
---------------------------------------------------------
*/
async function addTodayCancellationNotificationToLibrarians(
  reservationId,
  cancellingUserId,
  reservationDate,
) {
  try {
    if (!reservationDate) {
      return {
        success: false,
        message: "Reservation date is required for librarian notification",
      };
    }

    const sql = `
      INSERT INTO notification
        (
          userId,
          message,
          type,
          isRead
        )
      SELECT
        librarian.userId,

        CONCAT(
          'Same-day reservation #',
          reservation.reservationId,
          ' for seat ',
          reservation.seatId,
          ' was cancelled by ',
          COALESCE(
            cancellingUser.fullName,
            'a reader'
          ),
          '. Time: ',
          TIME_FORMAT(
            reservation.startTime,
            '%H:%i'
          ),
          ' - ',
          TIME_FORMAT(
            reservation.endTime,
            '%H:%i'
          )
        ),

        'same_day_reservation_cancelled',
        0

      FROM seat_reservation AS reservation

      INNER JOIN user AS cancellingUser
        ON cancellingUser.userId =
          reservation.userId

      CROSS JOIN user AS librarian

      WHERE reservation.reservationId = ?
        AND reservation.userId = ?
        AND reservation.reservationDate = ?
        AND LOWER(librarian.role) =
          'librarian'
        AND LOWER(librarian.status) =
          'active'
    `;

    const result = await doQuery(sql, [
      reservationId,
      cancellingUserId,
      reservationDate,
    ]);

    return {
      success: true,
      createdNotifications: result.affectedRows,
    };
  } catch (error) {
    console.error("Error creating same-day cancellation notifications:", error);

    return {
      success: false,
      message: "Failed to notify librarians about the cancellation",
    };
  }
}

/*
---------------------------------------------------------
getNotificationsByUser

תפקיד:
שולפת את כל ההתראות של משתמש מסוים,
מהחדשה לישנה.
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
      ORDER BY
        sentDate DESC,
        notificationId DESC
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

userId מונע ממשתמש לסמן התראה
השייכת למשתמש אחר.
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
מסמנת את כל ההתראות שלא נקראו אצל המשתמש.
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
  addNotificationToActiveLibrarians,
  addTodayCancellationNotificationToLibrarians,
  getNotificationsByUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
