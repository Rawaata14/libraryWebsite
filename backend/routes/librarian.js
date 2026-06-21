/*
=========================================================
librarian.js

תיאור הקובץ:
Routes עבור דשבורד הספרן.

הקובץ כולל:
- שליפת נתונים אמיתיים מה-DB.
- החזרת נתוני Important Updates.
- החזרת פעילות יומית אחרונה.
=========================================================
*/

const express = require("express");
const router = express.Router();
const doQuery = require("../database/query");

/*
---------------------------------------------------------
Route: GET /api/librarian/dashboard-stats

תפקיד:
מחזיר נתונים אמיתיים מה-DB לדשבורד הספרן.
---------------------------------------------------------
*/
router.get("/dashboard-stats", async (req, res) => {
  try {
    const activeLoans = await doQuery(
      "SELECT COUNT(*) AS count FROM `loan` WHERE status = 'ACTIVE'",
    );

    const overdueBooks = await doQuery(
      "SELECT COUNT(*) AS count FROM `loan` WHERE status = 'LATE'",
    );

    const unreadMessages = await doQuery(
      "SELECT COUNT(*) AS count FROM `messages` WHERE isRead = 0",
    );

    const blockedSeats = await doQuery(
      "SELECT COUNT(*) AS count FROM `seat` WHERE status = 'blocked'",
    );

    const todayReservations = await doQuery(
      `SELECT reservationId, seatId, startTime, endTime, status
       FROM seat_reservation
       WHERE reservationDate = CURDATE()
       ORDER BY startTime ASC
       LIMIT 5`,
    );

    const todayMessages = await doQuery(
      `SELECT senderName, createdAt
       FROM messages
       WHERE DATE(createdAt) = CURDATE()
       ORDER BY createdAt DESC
       LIMIT 5`,
    );

    const todayActivity = [
      ...todayReservations.map(
        (reservation) =>
          `Seat ${reservation.seatId} reserved from ${reservation.startTime} to ${reservation.endTime} (${reservation.status})`,
      ),

      ...todayMessages.map(
        (message) => `New message from ${message.senderName}`,
      ),
    ];

    return res.status(200).json({
      success: true,
      stats: {
        activeLoans: activeLoans[0].count,
        overdueBooks: overdueBooks[0].count,
        unreadMessages: unreadMessages[0].count,
        blockedSeats: blockedSeats[0].count,
        todayActivity,
      },
    });
  } catch (error) {
    console.error("Failed to load librarian dashboard stats:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load librarian dashboard stats",
    });
  }
});

module.exports = router;
