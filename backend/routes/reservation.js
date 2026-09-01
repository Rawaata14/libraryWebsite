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
- שילוב רשימת ההמתנה למקומות.
- החזרת ספרים למלאי לאחר ביטול מקום.
- שליחת הודעה והתראה לבעל הזמנה.
- שליחת מייל דרך שירות המייל המרכזי.
- שליפת שעות הזמנה אפשריות.
=========================================================
*/

const express = require("express");

const reservationQueries = require("../database/queries/reservationQueries");

const notificationQueries = require("../database/queries/notificationQueries");

const waitingListService = require("../services/waitingListService");

const { sendLibraryEmail } = require("../utils/mailer");

const router = express.Router();

/*
---------------------------------------------------------
POST /reservations/reserve-seat

תפקיד:
יוצרת הזמנת מקום עבור המשתמש המחובר.

אם קיימת הצעה פעילה מרשימת ההמתנה:
- רק המשתמש שקיבל את ההצעה רשאי להזמין.
- לאחר יצירת ההזמנה ההצעה מסומנת כמומשה.

אם אין הצעה פעילה:
הזמנת המקום מתבצעת בדרך הרגילה.
---------------------------------------------------------
*/
router.post("/reserve-seat", async (req, res) => {
  try {
    if (!req.session?.user) {
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

    /*
    -------------------------------------------------------
    בדיקת גישה להצעת רשימת ההמתנה

    אם קיימת הצעה פעילה עבור המקום וטווח הזמן,
    משתמש אחר אינו יכול להזמין אותו לפני פקיעת
    ההצעה.
    -------------------------------------------------------
    */
    const offerAccess = await waitingListService.validateSeatOfferAccess(
      seatId,
      req.session.user.userId,
      date,
      startTime,
      endTime,
    );

    if (!offerAccess.success) {
      return res.status(offerAccess.status || 409).json({
        message:
          offerAccess.message ||
          "This seat is currently offered to another user.",
      });
    }

    /*
    -------------------------------------------------------
    יצירת הזמנת המקום

    reserveSeat מבצעת מחדש בדיקת תאריך, שעה
    וחפיפה לפני שמירת ההזמנה.
    -------------------------------------------------------
    */
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

    /*
    -------------------------------------------------------
    יצירת התראה למשתמש

    כשל ביצירת ההתראה אינו מבטל הזמנה שכבר
    נשמרה בהצלחה במסד הנתונים.
    -------------------------------------------------------
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

    /*
    -------------------------------------------------------
    השלמת הצעת רשימת ההמתנה

    ההצעה מסומנת כמומשה רק לאחר שהזמנת המקום
    נוצרה בהצלחה.
    -------------------------------------------------------
    */
    if (offerAccess.waitingId) {
      try {
        await waitingListService.completeOffer("seat", offerAccess.waitingId);
      } catch (waitingListError) {
        console.error(
          "Seat was reserved, but completing the waiting-list offer failed:",
          waitingListError,
        );
      }
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
מחזירה הזמנות לפי תפקיד המשתמש:
- ספרנית מקבלת את כל ההזמנות.
- משתמש רגיל מקבל רק את ההזמנות שלו.
---------------------------------------------------------
*/
router.get("/get-reservations", async (req, res) => {
  try {
    if (!req.session?.user) {
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

תפקיד:
מבטלת הזמנה השייכת למשתמש המחובר.

לאחר ביטול מוצלח:
- המשתמש מקבל התראה.
- אם זה ביטול לאותו יום, הספרניות מקבלות התראה.
- המקום מוצע למשתמש הבא ברשימת ההמתנה.
- הספרים הקשורים להזמנה חוזרים למלאי.
---------------------------------------------------------
*/
router.patch("/:reservationId/cancel", async (req, res) => {
  try {
    if (!req.session?.user) {
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

    /*
      -------------------------------------------------------
      יצירת התראה למשתמש שביטל את ההזמנה
      -------------------------------------------------------
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
      -------------------------------------------------------
      התראה לספרניות על ביטול באותו יום

      התראה זו נוצרת רק עבור ביטול שביצע משתמש
      רגיל ורק אם ההזמנה הייתה לאותו יום.
      -------------------------------------------------------
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

    /*
      -------------------------------------------------------
      הצעת המקום למשתמש הבא

      הפעולה נמצאת ב-try נפרד כדי שכשל בהצעת
      המקום לא ימנע את החזרת הספרים למלאי.
      -------------------------------------------------------
      */
    try {
      await waitingListService.offerNextSeat(
        result.data.seatId,
        result.data.reservationDate,
        result.data.startTime,
        result.data.endTime,
      );
    } catch (waitingListError) {
      console.error(
        "Reservation was cancelled, but offering the seat to the next user failed:",
        waitingListError,
      );
    }

    /*
      -------------------------------------------------------
      החזרת הספרים הקשורים להזמנה

      לאחר החזרת הספרים למלאי, כל ספר שהתפנה
      מוצע למשתמש הבא שממתין לו.
      -------------------------------------------------------
      */
    try {
      await waitingListService.releaseReservationBooksAndOffer(reservationId);
    } catch (waitingListError) {
      console.error(
        "Reservation was cancelled, but releasing the reserved books failed:",
        waitingListError,
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
מאפשרת לספרנית לבטל הזמנה תוך ציון סיבה.

לאחר הביטול:
- המשתמש מקבל התראה.
- המקום מוצע למשתמש הבא ברשימת ההמתנה.
- הספרים הקשורים להזמנה חוזרים למלאי.
---------------------------------------------------------
*/
router.patch("/:reservationId/librarian-cancel", async (req, res) => {
  try {
    if (!req.session?.user) {
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
      -------------------------------------------------------
      התראה למשתמש הכוללת את סיבת הביטול
      -------------------------------------------------------
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

    /*
      -------------------------------------------------------
      הצעת המקום למשתמש הבא ברשימת ההמתנה
      -------------------------------------------------------
      */
    try {
      await waitingListService.offerNextSeat(
        result.data.seatId,
        result.data.reservationDate,
        result.data.startTime,
        result.data.endTime,
      );
    } catch (waitingListError) {
      console.error(
        "Librarian cancellation succeeded, but offering the seat to the next user failed:",
        waitingListError,
      );
    }

    /*
      -------------------------------------------------------
      החזרת הספרים הקשורים להזמנה למלאי

      פעולה זו נפרדת מהצעת המקום, כדי שכשל
      בפעולה אחת לא ימנע את הפעולה השנייה.
      -------------------------------------------------------
      */
    try {
      await waitingListService.releaseReservationBooksAndOffer(reservationId);
    } catch (waitingListError) {
      console.error(
        "Librarian cancellation succeeded, but releasing the reserved books failed:",
        waitingListError,
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

תפקיד:
מחזירה את חלונות הזמן שניתן לבחור עבור התאריך.

חלון מלא עדיין עשוי להופיע, כדי שהמשתמש יוכל
לבחור מקום תפוס ולהצטרף לרשימת ההמתנה.
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

תפקיד:
מאפשרת לספרנית לשלוח הודעה לבעל הזמנה.

הפעולה:
1. שומרת התראה בתוך המערכת.
2. מנסה לשלוח מייל דרך שירות המייל המרכזי.

אם פרטי המייל עדיין אינם מוגדרים:
ההתראה בתוך המערכת נשמרת והשרת אינו קורס.
---------------------------------------------------------
*/
router.post("/:reservationId/message", async (req, res) => {
  try {
    if (!req.session?.user) {
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

    /*
      -------------------------------------------------------
      שמירת ההתראה בתוך המערכת
      -------------------------------------------------------
      */
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

    /*
      -------------------------------------------------------
      שליחת מייל למשתמש

      המייל נשלח רק אם getReservationById החזירה
      את כתובת המייל של בעל ההזמנה.

      כשל במייל אינו מוחק את ההתראה שנשמרה.
      -------------------------------------------------------
      */
    if (reservation.userEmail) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: reservation.userEmail,
        subject: `הודעה מהספרייה: ${trimmedSubject}`,
        html: `
            <div
              dir="rtl"
              style="
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
              "
            >
              <h2 style="color: #2c3e50;">
                הודעה חדשה מהספרנית
              </h2>

              <p>
                התקבלה הודעה לגבי ההזמנה שלך
                (כיסא מספר
                <b>${reservation.seatId}</b>,
                הזמנה #${reservationId}):
              </p>

              <blockquote
                style="
                  background: #f9f9f9;
                  padding: 12px;
                  border-right: 4px solid #2c3e50;
                  margin: 10px 0;
                "
              >
                <b>${trimmedSubject}</b>
                <br>
                ${trimmedMessage}
              </blockquote>

              <p>
                בברכה,
                <br>
                <b>מערכת הספרייה</b>
              </p>
            </div>
          `,
      };

      const emailResult = await sendLibraryEmail(mailOptions);

      if (!emailResult.success) {
        console.error(
          "The in-app message was saved, but the email was not sent:",
          emailResult.message || emailResult.error,
        );
      }
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

/*
---------------------------------------------------------
ייצוא הנתיבים
---------------------------------------------------------
*/
module.exports = router;
