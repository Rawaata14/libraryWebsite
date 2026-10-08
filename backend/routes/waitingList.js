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

    if (!requestedDate || !requestedStartTime || !requestedEndTime) {
      return res.status(400).json({
        success: false,
        message: "Date, start time, and end time are required.",
      });
    }

    const userId = req.session.user.userId;

    // 1. בדיקת סך כל הכיסאות הפעילים (הניתנים להזמנה) בספרייה
    const sqlTotalSeats = `
      SELECT COUNT(*) AS count
      FROM seat
      WHERE LOWER(status) <> 'blocked'
        AND type IN ('seat', 'seat-to-add', 'single-seat', 'computer-seat')
    `;
    const totalSeatsResult = await require("../database/query")(sqlTotalSeats);
    const reservableCount = Number(totalSeatsResult[0]?.count) || 0;

    // 2. בדיקת כמה מקומות תפוסים בפועל באותו חלון זמן
    const sqlCheckOccupied = `
      SELECT COUNT(*) AS bookedCount
      FROM seat_reservation
      WHERE reservationDate = ?
        AND startTime = ?
        AND endTime = ?
        AND LOWER(status) <> 'cancelled'
    `;
    const occupiedResult = await require("../database/query")(
      sqlCheckOccupied,
      [requestedDate, requestedStartTime, requestedEndTime],
    );
    const bookedCount = Number(occupiedResult[0]?.bookedCount) || 0;

    // אם הספרייה עדיין לא מלאה לחלוטין, לא מאפשרים להיכנס לתור הכללי
    if (bookedCount < reservableCount) {
      return res.status(400).json({
        success: false,
        message:
          "There are still available seats for this time slot. Please choose an available seat instead.",
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
        AND seatId IS NULL
        AND status IN ('waiting', 'offered')
    `;
    const existingEntry = await require("../database/query")(sqlCheckExisting, [
      userId,
      requestedDate,
      requestedStartTime,
      requestedEndTime,
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
    const insertResult = await require("../database/query")(sqlInsert, [
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

module.exports = router;
