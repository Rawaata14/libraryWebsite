/*
=========================================================
librarian.js

תיאור הקובץ:
Routes עבור דשבורד הספרנית.

הקובץ אחראי על:
- שליפת סטטיסטיקות מרכזיות ממסד הנתונים (דרך שכבת השאילתות).
- חישוב הזמנות היום לפי חלונות זמן.
- חישוב מספר המקומות הזמינים בכל חלון.
- החזרת פעילות יומית אחרונה.
- הגבלת הגישה למשתמשת בעלת הרשאת ספרנית.
=========================================================
*/

const express = require("express");
const { requireLibrarian } = require("../middleware/auth");

const {
  getTodayReservationsCount,
  getHourlyReservationsForToday,
  getRecentTodayReservations,
} = require("../queries/reservationQueries");
const {
  getLoansCountByStatus,
  getActiveLoansListForLibrarian,
} = require("../queries/bookQueries");
const {
  getBlockedSeatsCount,
  getReservableSeatsCount,
} = require("../queries/seatQueries");
const {
  getUnreadLibrarianMessagesCount,
  getRecentTodayMessages,
} = require("../queries/messageQueries");

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
      todayReservations,
      activeLoans,
      activeLoansList,
      overdueBooks,
      unreadMessages,
      blockedSeats,
      totalReservableSeats,
      hourlyReservationsResult,
      todayReservationsActivity,
      todayMessagesActivity,
    ] = await Promise.all([
      getTodayReservationsCount(),
      getLoansCountByStatus("active"),
      getActiveLoansListForLibrarian(),
      getLoansCountByStatus("late"),
      getUnreadLibrarianMessagesCount(),
      getBlockedSeatsCount(),
      getReservableSeatsCount(),
      getHourlyReservationsForToday(),
      getRecentTodayReservations(),
      getRecentTodayMessages(),
    ]);

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
        activeLoans,
        activeLoansList,
        overdueBooks,
        unreadMessages,
        blockedSeats,
        todayReservations,
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
