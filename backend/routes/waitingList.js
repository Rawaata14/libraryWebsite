/*
=========================================================
waitingList.js

תיאור הקובץ:
Routes לניהול רשימות ההמתנה של ספרים ומקומות.

אחריות:
- הצטרפות לרשימת המתנה של ספר.
- הצטרפות לרשימת המתנה של מקום ומועד.
- שליפת ההמתנות של המשתמש המחובר.
- שליפת כל ההמתנות עבור ספרנית.
- יציאה מרשימת המתנה.

אבטחה:
- כל הנתיבים דורשים משתמש מחובר.
- שליפת כל הרשימות מוגבלת לספרנית.
- userId מתקבל מה-Session ולא מה-Frontend.
=========================================================
*/

const express = require("express");

const { requireAuth, requireLibrarian } = require("../middleware/auth");

const waitingListService = require("../services/waitingListService");
const {
  getOpeningHours,
  isValidReservationSlot,
} = require("../utils/libraryHours");

const {
  isValidDate,
  isValidTime,
  normalizeTime,
  getLibraryDateTime,
} = require("../utils/formatters");
const { doQuery } = require("../database/query");
const seatQueries = require("../database/queries/seatQueries");

const router = express.Router();

/*
---------------------------------------------------------
POST /waiting-lists/books/:bookId

תפקיד:
מצרף את המשתמש המחובר לרשימת ההמתנה
של ספר מסוים.

ה-Frontend שולח בגוף הבקשה:
{
  "reservationId": 12
}

reservationId הוא מזהה הזמנת המקום שבמסגרתה
המשתמש מעוניין להשתמש בספר.

למה הוא נדרש:
לפי כללי הפרויקט, לא ניתן להזמין ספר בלי
הזמנת מקום תקפה.
---------------------------------------------------------
*/
router.post("/books/:bookId", requireAuth, async (req, res) => {
  try {
    const bookId = Number(req.params.bookId);

    const reservationId = Number(req.body.reservationId);

    /*
      בדיקת מזהה הספר.
      */
    if (!Number.isInteger(bookId) || bookId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID.",
      });
    }

    /*
      בדיקת מזהה הזמנת המקום.
      */
    if (!Number.isInteger(reservationId) || reservationId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid seat reservation must be selected.",
      });
    }

    const userId = Number(req.session.user.userId);

    /*
      בדיקה האם למשתמש יש כבר השאלה פעילה או באיחור לספר הזה.
      אם כן, חוסמים את האפשרות להירשם לרשימת ההמתנה.
      */
    const hasActiveLoan = await loanQueries.hasActiveLoanForBook(
      bookId,
      userId,
    );

    if (hasActiveLoan) {
      return res.status(400).json({
        success: false,
        message:
          "You already have an active loan for this book and cannot join the waiting list.",
      });
    }

    /*
      userId נלקח מה-Session.
      */
    const result = await waitingListService.joinBookWaitingList(
      bookId,
      userId,
      reservationId,
    );

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    console.error("Error joining book waiting list:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
});

/*
---------------------------------------------------------
POST /waiting-lists/seats

תפקיד:
מצרף את המשתמש המחובר לרשימת המתנה
של מקום תפוס במועד מסוים.

ה-Frontend שולח:
{
  "seatId": 10,
  "requestedDate": "2026-09-10",
  "requestedStartTime": "10:00",
  "requestedEndTime": "12:00"
}

רשימת ההמתנה נפרדת עבור כל שילוב של:
- מקום.
- תאריך.
- שעת התחלה.
- שעת סיום.
---------------------------------------------------------
*/
router.post("/seats", requireAuth, async (req, res) => {
  try {
    const seatId = Number(req.body.seatId);

    /*
      בדיקת מזהה המקום לפני העברת הנתונים
      לשכבת השירות.
      */
    if (!Number.isInteger(seatId) || seatId <= 0) {
      return res.status(400).json({
        success: false,

        message: "Invalid seat ID.",
      });
    }

    const result = await waitingListService.joinSeatWaitingList({
      seatId,

      /*
            זהות המשתמש מתקבלת מה-Session.
            */
      userId: req.session.user.userId,

      requestedDate: req.body.requestedDate,

      requestedStartTime: req.body.requestedStartTime,

      requestedEndTime: req.body.requestedEndTime,
    });

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    console.error("Error joining seat waiting list:", error);

    return res.status(500).json({
      success: false,

      message: "Internal server error.",
    });
  }
});

/*
---------------------------------------------------------
GET /waiting-lists/mine

תפקיד:
מחזיר למשתמש המחובר את רשימות ההמתנה
הפעילות שלו.

התוצאה כוללת:
- המתנות לספרים.
- המתנות למקומות.
- מיקום בתור.
- מצב ההמתנה.
- זמן תפוגת הצעה, אם קיימת.

השרת מחזיר רק רשומות השייכות ל-userId
שנמצא ב-Session.
---------------------------------------------------------
*/
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const result = await waitingListService.getMyWaitingLists(
      req.session.user.userId,
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error loading user waiting lists:", error);

    return res.status(500).json({
      success: false,

      message: "Internal server error.",
    });
  }
});

/*
---------------------------------------------------------
GET /waiting-lists/all

תפקיד:
מחזיר לספרנית את כל רשימות ההמתנה הפעילות.

גישה:
רק משתמשת מחוברת בעלת תפקיד librarian.

הנתונים משמשים את הדף:
Manage Waiting Lists
---------------------------------------------------------
*/
router.get("/all", requireLibrarian, async (req, res) => {
  try {
    const result = await waitingListService.getAllWaitingLists();

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error loading librarian waiting lists:", error);

    return res.status(500).json({
      success: false,

      message: "Internal server error.",
    });
  }
});

/*
---------------------------------------------------------
DELETE /waiting-lists/:type/:waitingId

תפקיד:
מוציא את המשתמש המחובר מרשימת המתנה.

type יכול להיות:
- book
- seat

השרת בודק שהרשומה שייכת למשתמש המחובר.

אם המשתמש ביטל הצעה שכבר נשלחה אליו:
המערכת מעבירה את ההצעה למשתמש הבא בתור.
---------------------------------------------------------
*/
router.delete("/:type/:waitingId", requireAuth, async (req, res) => {
  try {
    const waitingId = Number(req.params.waitingId);

    /*
      בדיקת סוג רשימת ההמתנה.
      */
    if (!["book", "seat"].includes(req.params.type)) {
      return res.status(400).json({
        success: false,

        message: "Invalid waiting-list type.",
      });
    }

    /*
      בדיקת מזהה רשומת ההמתנה.
      */
    if (!Number.isInteger(waitingId) || waitingId <= 0) {
      return res.status(400).json({
        success: false,

        message: "Invalid waiting-list ID.",
      });
    }
    console.log(
      `User ${req.session.user.userId} is leaving waiting list ${req.params.type} with ID ${waitingId}`,
    );
    const result = await waitingListService.cancelWaitingEntry(
      req.params.type,
      waitingId,
      req.session.user.userId,
    );

    return res.status(result.statusCode || 200).json(result);
  } catch (error) {
    console.error("Error leaving waiting list:", error);

    return res.status(500).json({
      success: false,

      message: "Internal server error.",
    });
  }
});

/*
---------------------------------------------------------
POST /waiting-lists/general-seats

תפקיד:
מצרף את המשתמש המחובר לרשימת המתנה כללית למקומות ישיבה
עבור תאריך ושעה שבהם כל מקומות הספרייה מלאים.

ה-Frontend שולח:
{
  "requestedDate": "2026-09-10",
  "requestedStartTime": "10:00",
  "requestedEndTime": "12:00"
}
---------------------------------------------------------
*/
router.post("/general-seats", requireAuth, async (req, res) => {
  try {
    const { requestedDate, requestedStartTime, requestedEndTime } = req.body;

    // בדיקת תקינות התאריך והשעות
    if (
      !isValidDate(requestedDate) ||
      !isValidTime(requestedStartTime) ||
      !isValidTime(requestedEndTime)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid waiting-list date or time.",
      });
    }

    const startTime = normalizeTime(requestedStartTime);
    const endTime = normalizeTime(requestedEndTime);

    // בדיקת סדר השעות
    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: "Start time must be earlier than end time.",
      });
    }

    // בדיקה שהספרייה פתוחה בתאריך המבוקש
    const openingHours = getOpeningHours(requestedDate);

    if (!openingHours) {
      return res.status(400).json({
        success: false,
        message: "The library is closed on the selected date.",
      });
    }

    // בדיקת התאמה לחלון הזמנה מורשה
    if (!isValidReservationSlot(requestedDate, startTime, endTime)) {
      return res.status(400).json({
        success: false,
        message:
          `Invalid waiting-list time slot. Library opening hours: ` +
          `${openingHours.open} - ${openingHours.close}`,
      });
    }

    // מניעת הצטרפות לרשימת המתנה עבור מועד שכבר התחיל
    const libraryNow = getLibraryDateTime();

    if (`${requestedDate}T${startTime}` <= libraryNow.dateTimeKey) {
      return res.status(400).json({
        success: false,
        message: "The waiting-list time slot must start in the future.",
      });
    }

    const userId = req.session.user.userId;

    // בדיקת זמינות מקומות בהתאם למשתמש המחובר
    const mapResult = await seatQueries.getMapSeatsByTimeSlot(
      requestedDate,
      startTime,
      endTime,
      userId,
    );

    if (!mapResult.success) {
      return res.status(500).json({
        success: false,
        message: "Unable to check seat availability.",
      });
    }

    // סינון כיסאות הניתנים להזמנה
    const reservableSeats = mapResult.map.filter(
      (seat) =>
        ["seat", "single-seat", "computer-seat"].includes(seat.type) &&
        String(seat.status).toLowerCase() !== "blocked",
    );

    // בדיקה שכל הכיסאות תפוסים או שמורים זמנית
    const isLibraryFullyBooked =
      reservableSeats.length > 0 &&
      reservableSeats.every((seat) =>
        ["occupied", "held"].includes(String(seat.status).toLowerCase()),
      );

    if (!isLibraryFullyBooked) {
      return res.status(400).json({
        success: false,
        message:
          reservableSeats.length === 0
            ? "There are no reservable seats for this time slot."
            : "The library is not fully booked. Please check seat availability.",
      });
    }

    // 3. בדיקה האם המשתמש כבר נמצא ברשימת המתנה פעילה לאותה שעה בדיוק
    const sqlCheckExisting = `
      SELECT queueSeatId
      FROM waiting_list_seat
      WHERE userId = ?
        AND requestedDate = ?
        AND requestedStartTime = ?
        AND requestedEndTime = ?
        AND (
          (seatId IS NULL AND status = 'waiting')
          OR
          (status = 'offered' AND offerExpiresAt > ?)
        )
    `;
    const existingEntry = await doQuery(sqlCheckExisting, [
      userId,
      requestedDate,
      startTime,
      endTime,
      getLibraryDateTime().sqlDateTime,
    ]);

    if (existingEntry.length > 0) {
      return res.status(409).json({
        success: false,
        message: "You are already on the waiting list for this time slot.",
      });
    }

    // 4. הוספת המשתמש לרשימת ההמתנה הכללית (seatId מוגדר כ-NULL)
    const sqlInsert = `
      INSERT INTO waiting_list_seat (
        seatId,
        userId,
        requestedDate,
        requestedStartTime,
        requestedEndTime,
        status
      )
      VALUES (NULL, ?, ?, ?, ?, 'waiting')
    `;
    const insertResult = await doQuery(sqlInsert, [
      userId,
      requestedDate,
      requestedStartTime,
      requestedEndTime,
    ]);

    // שליחת התראה למשתמש
    const notificationQueries = require("../database/queries/notificationQueries");
    await notificationQueries.addNotification(
      userId,
      `You have successfully joined the general waiting list for seats on ${requestedDate} from ${requestedStartTime} to ${requestedEndTime}.`,
      "waiting_list_joined",
    );

    return res.status(201).json({
      success: true,
      message: "Successfully joined the waiting list",
      queueSeatId: insertResult.insertId,
    });
  } catch (error) {
    console.error("Error joining general seat waiting list:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
});

/*
---------------------------------------------------------
DELETE /waiting-lists/librarian/:type/:waitingId

תפקיד:
ביטול ניהולי של רשימת המתנה (ספר או מקום) על ידי ספרנית.

גישה:
רק משתמשת מחוברת בעלת תפקיד librarian.
---------------------------------------------------------
*/
router.delete(
  "/librarian/:type/:waitingId",
  requireLibrarian,
  async (req, res) => {
    try {
      const waitingId = Number(req.params.waitingId);
      const type = req.params.type;

      if (!["book", "seat"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid waiting-list type.",
        });
      }

      if (!Number.isInteger(waitingId) || waitingId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid waiting-list ID.",
        });
      }

      // שימוש בשירות הניהולי של הספרנית כדי שגם יבטל וגם יקדם את הבא בתור
      let result;
      if (type === "book") {
        result =
          await waitingListService.cancelBookEntryByLibrarianService(waitingId);
      } else {
        result =
          await waitingListService.cancelSeatEntryByLibrarianService(waitingId);
      }

      if (!result.success) {
        return res.status(result.statusCode || 400).json({
          success: false,
          message: result.message || "Failed to cancel waiting entry.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          result.message ||
          "Waiting entry successfully cancelled by librarian.",
      });
    } catch (error) {
      console.error("Error cancelling waiting entry by librarian:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  },
);

module.exports = router;
