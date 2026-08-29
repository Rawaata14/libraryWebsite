/*
=========================================================
reservation.js

תיאור הקובץ:
Routes לניהול הזמנות מקומות.

הקובץ אחראי על:
- יצירת הזמנה.
- שליפת הזמנות.
- ביטול על ידי משתמש.
- ביטול חריג על ידי ספרנית.
- שליחת הודעה לבעל הזמנה.
- שליפת שעות זמינות.
=========================================================
*/

const express = require("express");

const router = express.Router();

const reservationQueries = require("../database/queries/reservationQueries");

const notificationQueries = require("../database/queries/notificationQueries");

/*
---------------------------------------------------------
POST /reservations/reserve-seat
---------------------------------------------------------
*/
router.post("/reserve-seat", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { seatId, date, startTime, endTime } = req.body;

    if (!seatId || !date || !startTime || !endTime) {
      return res.status(400).json({
        message: "All reservation details are required",
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
      תאריך או שעה לא תקינים, או ניסיון
      לבצע הזמנה בעבר.
    */
    if (result.invalidReservation) {
      return res.status(400).json({
        message: result.message || "Invalid reservation date or time",
      });
    }

    /*
      הכיסא כבר תפוס בטווח שנבחר.
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
      אישור למשתמש על יצירת ההזמנה.

      הספרניות אינן מקבלות התראה על כל
      הזמנה חדשה, בהתאם למדיניות שנבחרה.
    */
    const notificationResult = await notificationQueries.addNotification(
      req.session.user.userId,
      `Reservation created successfully for seat ${seatId} on ${date}`,
      "reservation_created",
    );

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
---------------------------------------------------------
*/
router.get("/get-reservations", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    let result;

    if (req.session.user.role === "librarian") {
      result = await reservationQueries.getAllReservations();
    } else {
      result = await reservationQueries.getReservationsByUser(
        req.session.user.userId,
      );
    }

    if (!result.success) {
      return res.status(500).json({
        message: result.message || "Failed to fetch reservations",
      });
    }

    return res.status(200).json({
      reservations: result.data,
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

מדיניות:
משתמש יכול לבטל רק לפני שעת תחילת ההזמנה.
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

    const result = await reservationQueries.cancelReservation(
      reservationId,
      req.session.user.userId,
    );

    if (result.notFound) {
      return res.status(404).json({
        message: result.message || "Reservation not found",
      });
    }

    if (result.alreadyCancelled) {
      return res.status(409).json({
        message: result.message || "Reservation is already cancelled",
      });
    }

    /*
        שעת תחילת ההזמנה כבר הגיעה.
      */
    if (result.cancellationClosed) {
      return res.status(409).json({
        message:
          result.message || "This reservation can no longer be cancelled.",
      });
    }

    if (!result.success) {
      return res.status(500).json({
        message: result.message || "Failed to cancel reservation",
      });
    }

    /*
        אישור ביטול למשתמש.
      */
    const notificationResult = await notificationQueries.addNotification(
      req.session.user.userId,
      `Reservation number ${reservationId} was cancelled successfully`,
      "reservation_cancelled",
    );

    if (!notificationResult?.success) {
      console.error(
        "Reservation was cancelled, but user notification creation failed.",
      );
    }

    /*
        הספרניות מקבלות התראה רק אם:

        - הביטול בוצע על ידי משתמש רגיל.
        - ההזמנה שבוטלה היא של היום בישראל.

        result.data.isToday חושב בשכבת השאילתות
        לפי Asia/Jerusalem.
      */
    if (req.session.user.role !== "librarian" && result.data?.isToday) {
      const librarianNotificationResult =
        await notificationQueries.addTodayCancellationNotificationToLibrarians(
          reservationId,
          req.session.user.userId,
          result.data.reservationDate,
        );

      if (!librarianNotificationResult.success) {
        console.error(
          "Reservation was cancelled, but same-day librarian notification creation failed.",
        );
      }
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

/*
---------------------------------------------------------
PATCH /reservations/:reservationId/librarian-cancel

הספרנית יכולה לבצע ביטול חריג גם לאחר
שעת תחילת ההזמנה.
---------------------------------------------------------
*/
router.patch("/:reservationId/librarian-cancel", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (req.session.user.role !== "librarian") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const reservationId = Number(req.params.reservationId);

    const { reason } = req.body;

    if (!Number.isInteger(reservationId) || reservationId <= 0) {
      return res.status(400).json({
        message: "Invalid reservation ID",
      });
    }

    const trimmedReason = String(reason || "").trim();

    if (!trimmedReason) {
      return res.status(400).json({
        message: "Cancellation reason is required",
      });
    }

    if (trimmedReason.length > 500) {
      return res.status(400).json({
        message: "Cancellation reason cannot exceed 500 characters",
      });
    }

    const result =
      await reservationQueries.cancelReservationByLibrarian(reservationId);

    if (result.notFound) {
      return res.status(404).json({
        message: result.message || "Reservation not found",
      });
    }

    if (result.alreadyCancelled) {
      return res.status(409).json({
        message: result.message || "Reservation is already cancelled",
      });
    }

    if (!result.success) {
      return res.status(500).json({
        message: result.message || "Failed to cancel reservation",
      });
    }

    /*
        המשתמש מקבל את סיבת הביטול.
        הספרנית אינה מקבלת התראה על פעולה
        שהיא ביצעה בעצמה.
      */
    const notificationResult = await notificationQueries.addNotification(
      result.data.userId,
      `Your reservation for seat ${result.data.seatId} was cancelled by the librarian. Reason: ${trimmedReason}`,
      "reservation_cancelled_by_librarian",
    );

    if (!notificationResult?.success) {
      console.error(
        "Reservation was cancelled, but notification creation failed.",
      );
    }

    return res.status(200).json({
      message: "Reservation cancelled successfully by librarian",
      reservationId,
    });
  } catch (error) {
    console.error("Error in librarian reservation cancellation:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

/*
---------------------------------------------------------
POST /reservations/:reservationId/message

מאפשר לספרנית לשלוח הודעה לבעל ההזמנה.
---------------------------------------------------------
*/
router.post("/:reservationId/message", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (req.session.user.role !== "librarian") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const reservationId = Number(req.params.reservationId);

    const { subject, message } = req.body;

    if (!Number.isInteger(reservationId) || reservationId <= 0) {
      return res.status(400).json({
        message: "Invalid reservation ID",
      });
    }

    const trimmedSubject = String(subject || "").trim();

    const trimmedMessage = String(message || "").trim();

    if (!trimmedSubject) {
      return res.status(400).json({
        message: "Message subject is required",
      });
    }

    if (!trimmedMessage) {
      return res.status(400).json({
        message: "Message content is required",
      });
    }

    if (trimmedSubject.length > 100) {
      return res.status(400).json({
        message: "Message subject cannot exceed 100 characters",
      });
    }

    if (trimmedMessage.length > 500) {
      return res.status(400).json({
        message: "Message cannot exceed 500 characters",
      });
    }

    /*
        אין לסמוך על userId שמגיע מה-Frontend.
        בעל ההזמנה נשלף מהמסד.
      */
    const reservationResult =
      await reservationQueries.getReservationById(reservationId);

    if (reservationResult.notFound) {
      return res.status(404).json({
        message: reservationResult.message || "Reservation not found",
      });
    }

    if (!reservationResult.success) {
      return res.status(500).json({
        message:
          reservationResult.message || "Failed to load reservation details",
      });
    }

    const reservation = reservationResult.data;

    const notificationMessage =
      `${trimmedSubject}: ${trimmedMessage} ` +
      `(Reservation #${reservationId}, ` +
      `Seat ${reservation.seatId})`;

    const notificationResult = await notificationQueries.addNotification(
      reservation.userId,
      notificationMessage,
      "librarian_message",
    );

    if (!notificationResult.success) {
      return res.status(500).json({
        message: "Failed to send message",
      });
    }

    return res.status(201).json({
      message: "Message sent successfully",
      reservationId,
      userId: reservation.userId,
    });
  } catch (error) {
    console.error("Error sending reservation message:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

/*
---------------------------------------------------------
GET /reservations/available-slots
---------------------------------------------------------
*/
router.get("/available-slots", async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        message: "Date is required",
      });
    }

    const result = await reservationQueries.getAllTimeSlotsAvailability(
      String(date),
    );

    if (result.invalidDate) {
      return res.status(400).json({
        message: result.message || "Invalid reservation date",
      });
    }

    if (!result.success) {
      return res.status(500).json({
        message: result.message || "Failed to load available slots",
      });
    }

    return res.status(200).json({
      slots: result.data,
    });
  } catch (error) {
    console.error("Error in available-slots route:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

module.exports = router;
