/*
=========================================================
librarian.js

׳×׳™׳׳•׳¨ ׳”׳§׳•׳‘׳¥:
Routes ׳¢׳‘׳•׳¨ ׳“׳©׳‘׳•׳¨׳“ ׳”׳¡׳₪׳¨׳ ׳™׳×.

׳”׳§׳•׳‘׳¥ ׳׳—׳¨׳׳™ ׳¢׳:
- ׳©׳׳™׳₪׳× ׳¡׳˜׳˜׳™׳¡׳˜׳™׳§׳•׳× ׳׳¨׳›׳–׳™׳•׳× ׳׳׳¡׳“ ׳”׳ ׳×׳•׳ ׳™׳ (׳“׳¨׳ ׳©׳›׳‘׳× ׳”׳©׳׳™׳׳×׳•׳×).
- ׳—׳™׳©׳•׳‘ ׳”׳–׳׳ ׳•׳× ׳”׳™׳•׳ ׳׳₪׳™ ׳—׳׳•׳ ׳•׳× ׳–׳׳.
- ׳—׳™׳©׳•׳‘ ׳׳¡׳₪׳¨ ׳”׳׳§׳•׳׳•׳× ׳”׳–׳׳™׳ ׳™׳ ׳‘׳›׳ ׳—׳׳•׳.
- ׳”׳—׳–׳¨׳× ׳₪׳¢׳™׳׳•׳× ׳™׳•׳׳™׳× ׳׳—׳¨׳•׳ ׳”.
- ׳”׳’׳‘׳׳× ׳”׳’׳™׳©׳” ׳׳׳©׳×׳׳©׳× ׳‘׳¢׳׳× ׳”׳¨׳©׳׳× ׳¡׳₪׳¨׳ ׳™׳×.
=========================================================
*/

const express = require("express");
const { requireLibrarian } = require("../middleware/auth");

const {
  getTodayReservationsCount,
  getHourlyReservationsForToday,
  getRecentTodayReservations,
} = require("../database/queries/reservationQueries");
const {
  getLoansCountByStatus,
  getActiveLoansListForLibrarian,
} = require("../database/queries/bookQueries");
const {
  getBlockedSeatsCount,
  getReservableSeatsCount,
} = require("../database/queries/seatQueries");
const {
  getUnreadLibrarianMessagesCount,
  getRecentTodayMessages,
} = require("../database/queries/messageQueries");

const router = express.Router();

/*
---------------------------------------------------------
RESERVATION_TIME_SLOTS

׳×׳₪׳§׳™׳“:
׳׳’׳“׳™׳¨ ׳‘׳׳§׳•׳ ׳׳¨׳›׳–׳™ ׳׳× ׳—׳׳•׳ ׳•׳× ׳”׳”׳–׳׳ ׳” ׳”׳™׳•׳׳™׳™׳
׳”׳׳•׳¦׳’׳™׳ ׳‘׳“׳©׳‘׳•׳¨׳“ ׳”׳¡׳₪׳¨׳ ׳™׳×.
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

׳×׳₪׳§׳™׳“:
׳׳—׳–׳™׳¨ ׳׳× ׳›׳ ׳ ׳×׳•׳ ׳™ ׳“׳©׳‘׳•׳¨׳“ ׳”׳¡׳₪׳¨׳ ׳™׳× ׳׳׳§׳•׳¨ ׳׳—׳“.

׳”׳ ׳×׳•׳ ׳™׳ ׳›׳•׳׳׳™׳:
- ׳׳¡׳₪׳¨ ׳”׳–׳׳ ׳•׳× ׳”׳™׳•׳.
- ׳”׳–׳׳ ׳•׳× ׳׳₪׳™ ׳—׳׳•׳ ׳–׳׳.
- ׳׳¡׳₪׳¨ ׳׳§׳•׳׳•׳× ׳–׳׳™׳ ׳™׳ ׳‘׳›׳ ׳—׳׳•׳.
- ׳”׳©׳׳׳•׳× ׳₪׳¢׳™׳׳•׳× ׳•׳¡׳₪׳¨׳™׳ ׳‘׳׳™׳—׳•׳¨.
- ׳”׳•׳“׳¢׳•׳× ׳©׳׳ ׳ ׳§׳¨׳׳•.
- ׳›׳™׳¡׳׳•׳× ׳—׳¡׳•׳׳™׳.
- ׳₪׳¢׳™׳׳•׳× ׳”׳™׳•׳.
---------------------------------------------------------
*/
router.get("/dashboard-stats", requireLibrarian, async (req, res) => {
  try {
    /*
      ׳›׳ ׳”׳©׳׳™׳׳×׳•׳× ׳©׳׳™׳ ׳ ׳×׳׳•׳™׳•׳× ׳–׳• ׳‘׳–׳• ׳׳•׳₪׳¢׳׳•׳×
      ׳‘׳׳§׳‘׳™׳ ׳›׳“׳™ ׳׳§׳¦׳¨ ׳׳× ׳–׳׳ ׳˜׳¢׳™׳ ׳× ׳”׳“׳©׳‘׳•׳¨׳“.
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

      ׳×׳₪׳§׳™׳“:
      ׳‘׳•׳ ׳” ׳׳× ׳›׳ ׳—׳׳•׳ ׳•׳× ׳”׳–׳׳, ׳’׳ ׳׳ ׳׳™׳ ׳‘׳”׳ ׳”׳–׳׳ ׳•׳×,
      ׳•׳׳—׳©׳‘ ׳׳× ׳׳¡׳₪׳¨ ׳”׳׳§׳•׳׳•׳× ׳”׳₪׳ ׳•׳™׳™׳ ׳‘׳›׳ ׳—׳׳•׳.
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

      ׳×׳₪׳§׳™׳“:
      ׳׳׳—׳“׳× ׳׳× ׳”׳”׳–׳׳ ׳•׳× ׳•׳”׳”׳•׳“׳¢׳•׳× ׳”׳׳—׳¨׳•׳ ׳•׳×
      ׳׳¨׳©׳™׳׳× ׳₪׳¢׳™׳׳•׳× ׳׳—׳×.
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
