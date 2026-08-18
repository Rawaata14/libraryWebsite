/*
=========================================================
librarian.js

תיאור הקובץ:
Routes עבור דשבורד הספרנית.

הקובץ אחראי על:
- שליפת סטטיסטיקות מרכזיות ממסד הנתונים.
- חישוב הזמנות היום לפי חלונות זמן.
- חישוב מספר המקומות הזמינים בכל חלון.
- החזרת פעילות יומית אחרונה.
- הגבלת הגישה למשתמשת בעלת הרשאת ספרנית.
=========================================================
*/

const express = require("express");

const doQuery = require("../database/query");
const { requireLibrarian } = require("../middleware/auth");

const router = express.Router();

/*
---------------------------------------------------------
RESERVATION_TIME_SLOTS

תפקיד:
מגדיר במקום מרכזי את חלונות ההזמנה היומיים
המוצגים בדשבורד הספרנית.
---------------------------------------------------------
*/
const RESERVATION_TIME_SLOTS = [
  { startTime: "08:00", endTime: "10:00" },
  { startTime: "10:00", endTime: "12:00" },
  { startTime: "12:00", endTime: "14:00" },
  { startTime: "14:00", endTime: "16:00" },
  { startTime: "16:00", endTime: "18:00" },
  { startTime: "18:00", endTime: "20:00" },
];

/*
---------------------------------------------------------
Route: GET /api/librarian/dashboard-stats

תפקיד:
מחזיר את כל נתוני דשבורד הספרנית ממקור אחד.

הנתונים כוללים:
- מספר הזמנות היום.
- הזמנות לפי חלון זמן.
- מספר מקומות זמינים בכל חלון.
- השאלות פעילות וספרים באיחור.
- הודעות שלא נקראו.
- כיסאות חסומים.
- פעילות היום.
---------------------------------------------------------
*/
router.get("/dashboard-stats", requireLibrarian, async (req, res) => {
  try {
    /*
      כל השאילתות שאינן תלויות זו בזו מופעלות
      במקביל כדי לקצר את זמן טעינת הדשבורד.
      */
    const [
      todayReservationsResult,
      activeLoansResult,
      overdueBooksResult,
      unreadMessagesResult,
      blockedSeatsResult,
      reservableSeatsResult,
      hourlyReservationsResult,
      todayReservationsActivity,
      todayMessagesActivity,
    ] = await Promise.all([
      doQuery(`
          SELECT COUNT(*) AS count
          FROM seat_reservation
          WHERE reservationDate = CURDATE()
            AND LOWER(status) <> 'cancelled'
        `),

      doQuery(`
          SELECT COUNT(*) AS count
          FROM loan
          WHERE LOWER(status) = 'active'
        `),

      doQuery(`
          SELECT COUNT(*) AS count
          FROM loan
          WHERE LOWER(status) = 'late'
        `),

      doQuery(`
          SELECT COUNT(*) AS count
          FROM messages
          WHERE isRead = 0
        `),

      doQuery(`
          SELECT COUNT(*) AS count
          FROM seat
          WHERE LOWER(status) = 'blocked'
        `),

      /*
        סופרים רק פריטים שניתן להזמין.
        שולחנות ועמדת הקבלה אינם חלק מהקיבולת.
        */
      doQuery(`
          SELECT COUNT(*) AS count
          FROM seat
          WHERE LOWER(status) <> 'blocked'
            AND type IN (
              'seat',
              'seat-to-add',
              'single-seat',
              'computer-seat'
            )
        `),

      doQuery(`
          SELECT
            TIME_FORMAT(startTime, '%H:%i') AS startTime,
            TIME_FORMAT(endTime, '%H:%i') AS endTime,
            COUNT(*) AS booked
          FROM seat_reservation
          WHERE reservationDate = CURDATE()
            AND LOWER(status) <> 'cancelled'
          GROUP BY startTime, endTime
          ORDER BY startTime ASC
        `),

      doQuery(`
          SELECT
            reservationId,
            seatId,
            startTime,
            endTime,
            status
          FROM seat_reservation
          WHERE reservationDate = CURDATE()
          ORDER BY startTime ASC
          LIMIT 5
        `),

      doQuery(`
          SELECT senderName, createdAt
          FROM messages
          WHERE DATE(createdAt) = CURDATE()
          ORDER BY createdAt DESC
          LIMIT 5
        `),
    ]);

    const totalReservableSeats = Number(reservableSeatsResult[0]?.count) || 0;

    /*
      ---------------------------------------------------
      hourlyReservations

      תפקיד:
      בונה את כל חלונות הזמן, גם אם אין בהם הזמנות,
      ומחשב את מספר המקומות הפנויים בכל חלון.
      ---------------------------------------------------
      */
    const hourlyReservations = RESERVATION_TIME_SLOTS.map((slot) => {
      const matchingResult = hourlyReservationsResult.find(
        (reservationSlot) =>
          reservationSlot.startTime === slot.startTime &&
          reservationSlot.endTime === slot.endTime,
      );

      const booked = Number(matchingResult?.booked) || 0;

      return {
        startTime: slot.startTime,
        endTime: slot.endTime,
        booked,
        available: Math.max(totalReservableSeats - booked, 0),
      };
    });

    /*
      ---------------------------------------------------
      todayActivity

      תפקיד:
      מאחדת את ההזמנות וההודעות האחרונות
      לרשימת פעילות אחת.
      ---------------------------------------------------
      */
    const todayActivity = [
      ...todayReservationsActivity.map((reservation) => {
        const startTime = String(reservation.startTime).slice(0, 5);

        const endTime = String(reservation.endTime).slice(0, 5);

        return `Seat ${reservation.seatId} reserved from ${startTime} to ${endTime} (${reservation.status})`;
      }),

      ...todayMessagesActivity.map(
        (message) => `New message from ${message.senderName}`,
      ),
    ];

    return res.status(200).json({
      success: true,
      stats: {
        activeLoans: Number(activeLoansResult[0]?.count) || 0,

        overdueBooks: Number(overdueBooksResult[0]?.count) || 0,

        unreadMessages: Number(unreadMessagesResult[0]?.count) || 0,

        blockedSeats: Number(blockedSeatsResult[0]?.count) || 0,

        todayReservations: Number(todayReservationsResult[0]?.count) || 0,

        hourlyReservations,
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
