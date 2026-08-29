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
- שליחת הודעה לבעל הזמנה ושליחת מייל אליו.
- שליפת שעות זמינות.
=========================================================
*/

const express = require("express");
const router = express.Router();

const reservationQueries = require("../database/queries/reservationQueries");
const notificationQueries = require("../database/queries/notificationQueries");
const transporter = require("../utils/mailer");

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

    if (result.invalidReservation) {
      return res.status(400).json({
        message: result.message || "Invalid reservation date or time",
      });
    }

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

/*
---------------------------------------------------------
POST /reservations/:reservationId/message
(שליחת הודעה לבעל ההזמנה + שליחת מייל דרך transporter)
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

    // 1. שמירת ההתראה בתוך המערכת
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

    // 2. שליחת מייל לסטודנט באמצעות ה-transporter הקיים
    if (reservation.userEmail) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: reservation.userEmail,
        subject: `הודעה מהספרייה: ${trimmedSubject}`,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #2c3e50;">הודעה חדשה מהספרנית</h2>
            <p>התקבלה הודעה לגבי ההזמנה שלך (כיסא מספר <b>${reservation.seatId}</b>, הזמנה #${reservationId}):</p>
            <blockquote style="background: #f9f9f9; padding: 12px; border-right: 4px solid #2c3e50; margin: 10px 0;">
              <b>${trimmedSubject}</b><br>
              ${trimmedMessage}
            </blockquote>
            <br>
            <p>בברכה,<br><b>מערכת הספרייה</b></p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
    }

    return res.status(200).json({
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

// ייצוא גם של ה-router וגם של פונקציית התזכורת (כדי שתוכל להפעיל אותה ב-Cron מחוץ לקובץ)
module.exports = router;
