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

/*
---------------------------------------------------------
PATCH /reservations/:reservationId/librarian-cancel

תפקיד:
מאפשר לספרן לבטל הזמנה במקרה חריג.

הנתיב:
- בודק שהמשתמש מחובר.
- בודק שהמשתמש הוא ספרן.
- מבטל את ההזמנה.
- יוצר התראה למשתמש בעל ההזמנה.
---------------------------------------------------------
*/
router.patch(
  "/:reservationId/librarian-cancel",
  async (req, res) => {
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

      if (!reason || !reason.trim()) {
        return res.status(400).json({
          message: "Cancellation reason is required",
        });
      }

      const result =
        await reservationQueries.cancelReservationByLibrarian(
          reservationId,
        );

      if (result.notFound) {
        return res.status(404).json({
          message: result.message,
        });
      }

      if (result.alreadyCancelled) {
        return res.status(409).json({
          message: result.message,
        });
      }

      if (!result.success) {
        return res.status(500).json({
          message:
            result.message || "Failed to cancel reservation",
        });
      }

      /*
        שליחת התראה למשתמש שהזמנתו בוטלה על ידי הספרן.
      */
      const notificationResult =
        await notificationQueries.addNotification(
          result.data.userId,
          `Your reservation for seat ${result.data.seatId} was cancelled by the librarian. Reason: ${reason.trim()}`,
          "reservation_cancelled_by_librarian",
        );

      if (!notificationResult?.success) {
        console.error(
          "Reservation was cancelled, but notification creation failed.",
        );
      }

      return res.status(200).json({
        message:
          "Reservation cancelled successfully by librarian",
        reservationId,
      });
    } catch (error) {
      console.error(
        "Error in librarian reservation cancellation:",
        error,
      );

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
);

/*
---------------------------------------------------------
POST /reservations/:reservationId/message

תפקיד:
מאפשר לספרן לשלוח הודעה פנימית למשתמש
שביצע את ההזמנה.

הנתיב:
- בודק שהמשתמש מחובר.
- בודק שהמשתמש הוא ספרן.
- מאתר את בעל ההזמנה.
- שומר את ההודעה בטבלת notification.
---------------------------------------------------------
*/
router.post("/:reservationId/message", async (req, res) => {
  try {
    // בדיקה שהמשתמש מחובר
    if (!req.session.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    // רק ספרן רשאי לשלוח הודעה מתוך ניהול ההזמנות
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

    if (!subject || !subject.trim()) {
      return res.status(400).json({
        message: "Message subject is required",
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Message content is required",
      });
    }

    if (subject.trim().length > 100) {
      return res.status(400).json({
        message: "Message subject cannot exceed 100 characters",
      });
    }

    if (message.trim().length > 500) {
      return res.status(400).json({
        message: "Message cannot exceed 500 characters",
      });
    }

    /*
      שליפת בעל ההזמנה.

      אין לסמוך על userId שמגיע מה-Frontend,
      משום שמשתמש יכול לשנות אותו ידנית.
    */
    const reservationResult =
      await reservationQueries.getReservationById(reservationId);

    if (reservationResult.notFound) {
      return res.status(404).json({
        message: reservationResult.message,
      });
    }

    if (!reservationResult.success) {
      return res.status(500).json({
        message:
          reservationResult.message ||
          "Failed to load reservation details",
      });
    }

    const reservation = reservationResult.data;

    const notificationMessage =
      `${subject.trim()}: ${message.trim()} ` +
      `(Reservation #${reservationId}, Seat ${reservation.seatId})`;

    const notificationResult =
      await notificationQueries.addNotification(
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
    console.error(
      "Error sending reservation message:",
      error,
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

module.exports = router;