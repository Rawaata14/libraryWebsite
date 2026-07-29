const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const seatQueries = require("../database/queries/seatQueries");
const reservationQueries = require("../database/queries/reservationQueries");
const notificationQueries = require("../database/queries/notificationQueries");

/*
---------------------------------------------------------
POST /reservations/reserve-seat

תפקיד:
יצירת הזמנת מקום חדשה עבור המשתמש המחובר.

הנתיב:
- בודק שהמשתמש מחובר.
- בודק שהתקבלו כל פרטי ההזמנה.
- מעביר את ההזמנה לשכבת השאילתות.
- מטפל בהתנגשות עם הזמנה קיימת.
- יוצר התראה לאחר הזמנה מוצלחת.
---------------------------------------------------------
*/
router.post("/reserve-seat", async (req, res) => {
  try {
    // בדיקה שהמשתמש מחובר למערכת
    if (!req.session.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { seatId, date, startTime, endTime } = req.body;

    // בדיקה שכל פרטי ההזמנה נשלחו
    if (!seatId || !date || !startTime || !endTime) {
      return res.status(400).json({
        message: "All reservation details are required",
      });
    }

    // שעת ההתחלה חייבת להיות מוקדמת משעת הסיום
    if (startTime >= endTime) {
      return res.status(400).json({
        message: "Start time must be earlier than end time",
      });
    }

    const result = await reservationQueries.reserveSeat({
      userId: req.session.user.userId,
      seatId,
      reservationDate: date,
      startTime,
      endTime,
      status: "occupied",
    });

    /*
      כאשר קיימת הזמנה חופפת, מוחזר 409 Conflict
      ולא 500, משום שלא מדובר בתקלה פנימית בשרת.
    */
    if (result.conflict) {
      return res.status(409).json({
        message:
          result.message ||
          "This seat is already reserved during the selected time.",
      });
    }

    if (!result.success) {
      return res.status(500).json({
        message: result.message || "Failed to reserve seat",
      });
    }

    /*
      יצירת התראה למשתמש לאחר שההזמנה
      נשמרה בהצלחה במסד הנתונים.
    */
    const notificationResult =
      await notificationQueries.addNotification(
        req.session.user.userId,
        `Reservation created successfully for seat ${seatId} on ${date}`,
        "reservation_created",
      );

    /*
      כישלון ביצירת התראה אינו מבטל את ההזמנה,
      משום שההזמנה כבר נשמרה בהצלחה.
    */
    if (!notificationResult?.success) {
      console.error(
        "Reservation was created, but notification creation failed.",
      );
    }

    return res.status(201).json({
      message: "Seat reserved successfully",
      reservationId: result.data.insertId,
    });
  } catch (error) {
    console.error("Error in reserving seat:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

/*
---------------------------------------------------------
GET /reservations/get-reservations

תפקיד:
שליפת הזמנות בהתאם לסוג המשתמש המחובר.

- ספרן מקבל את כל ההזמנות במערכת.
- משתמש רגיל מקבל רק את ההזמנות שלו.
---------------------------------------------------------
*/
router.get("/get-reservations", async (req, res) => {
  try {
    // בדיקה שהמשתמש מחובר למערכת
    if (!req.session.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    let result;

    /*
      ספרן רשאי לראות את כל ההזמנות.
      משתמש רגיל רשאי לראות רק את ההזמנות השייכות לו.
    */
    if (req.session.user.role === "librarian") {
      result = await reservationQueries.getAllReservations();
    } else {
      result = await reservationQueries.getReservationsByUser(
        req.session.user.userId,
      );
    }

    if (result.success) {
      return res.status(200).json({
        reservations: result.data,
      });
    }

    return res.status(500).json({
      message: result.message || "Failed to fetch reservations",
    });
  } catch (error) {
    console.error("Error in fetching reservations:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

/*
---------------------------------------------------------
PATCH /reservations/:reservationId/cancel

תפקיד:
ביטול הזמנה השייכת למשתמש המחובר.
---------------------------------------------------------
*/
router.patch("/:reservationId/cancel", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const reservationId = Number(req.params.reservationId);

    if (!Number.isInteger(reservationId) || reservationId <= 0) {
      return res.status(400).json({
        message: "Invalid reservation ID",
      });
    }

    console.log("Cancel reservation request:", {
      reservationId,
      userId: req.session.user.userId,
    });

    const result = await reservationQueries.cancelReservation(
      reservationId,
      req.session.user.userId,
    );

    console.log("Cancel reservation result:", result);

    if (result.notFound) {
      return res.status(404).json({
        message: result.message,
      });
    }

    if (!result.success) {
      return res.status(500).json({
        message: result.message || "Failed to cancel reservation",
      });
    }

    const notificationResult =
      await notificationQueries.addNotification(
        req.session.user.userId,
        `Reservation number ${reservationId} was cancelled successfully`,
        "reservation_cancelled",
      );

    if (!notificationResult?.success) {
      console.error(
        "Reservation was cancelled, but notification creation failed.",
      );
    }

    return res.status(200).json({
      message: "Reservation cancelled successfully",
      reservationId,
    });
  } catch (error) {
    console.error("Error in cancelling reservation:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

module.exports = router;