/*
=========================================================
seatWaitingListQueries.js

תיאור הקובץ:
שכבת השאילתות של רשימת ההמתנה למקומות.

אחריות:
- שליפת מקום לפי מזהה.
- בדיקת תפוסה במועד המבוקש.
- מניעת המתנה כפולה.
- הוספת משתמש לרשימת המתנה.
- שליפת ההמתנות של משתמש.
- שליפת כל ההמתנות עבור ספרנית.
- ביטול המתנה.
- בחירת המשתמש הראשון בתור.
- יצירת הצעה מוגבלת בזמן.
- בדיקת הרשאה למימוש הצעה.

רשימת המתנה למקום מוגדרת לפי השילוב:
seatId + requestedDate +
requestedStartTime + requestedEndTime
=========================================================
*/

const doQuery = require("../query");

/*
---------------------------------------------------------
getSeat

תפקיד:
מחזירה את פרטי המקום הנדרשים לצורך
הצטרפות לרשימת המתנה.

המידע כולל:
- מזהה המקום.
- אזור המקום.
- סוג המקום.
- הסטטוס המנהלי.

@param {number} seatId
מזהה המקום.

@returns {Promise<Object|null>}
מחזירה את המקום או null אם אינו קיים.
---------------------------------------------------------
*/
async function getSeat(seatId) {
  const sql = `
    SELECT
      seatId,
      location,
      type,
      status

    FROM seat

    WHERE seatId = ?

    LIMIT 1
  `;

  const seats = await doQuery(sql, [seatId]);

  return seats[0] || null;
}

/*
---------------------------------------------------------
hasSeatReservation

תפקיד:
בודקת אם קיימת הזמנה פעילה החופפת למקום
ולמועד המבוקשים.

בדיקת החפיפה:
הזמנה קיימת חופפת כאשר:

existing.startTime < requestedEndTime

וגם:

existing.endTime > requestedStartTime

הזמנות מבוטלות אינן חוסמות את המקום.

@param {number} seatId
מזהה המקום.

@param {string} requestedDate
התאריך המבוקש.

@param {string} requestedStartTime
שעת ההתחלה המבוקשת.

@param {string} requestedEndTime
שעת הסיום המבוקשת.

@returns {Promise<boolean>}
true אם המקום תפוס במועד המבוקש.
---------------------------------------------------------
*/
async function hasSeatReservation(
  seatId,
  requestedDate,
  requestedStartTime,
  requestedEndTime,
) {
  const sql = `
    SELECT reservationId

    FROM seat_reservation

    WHERE seatId = ?
      AND reservationDate = ?

      AND LOWER(status) NOT IN (
        'cancelled',
        'canceled'
      )

      AND startTime < ?
      AND endTime > ?

    LIMIT 1
  `;

  const reservations = await doQuery(sql, [
    seatId,
    requestedDate,
    requestedEndTime,
    requestedStartTime,
  ]);

  return reservations.length > 0;
}

/*
---------------------------------------------------------
getActiveSeatEntry

תפקיד:
בודקת אם למשתמש כבר קיימת המתנה פעילה
לאותו מקום ובאותו מועד.

סטטוסים פעילים:
- waiting
- offered

כך משתמש אינו יכול להירשם פעמיים לאותה
רשימת המתנה.

@param {number} seatId
מזהה המקום.

@param {number} userId
מזהה המשתמש.

@param {string} requestedDate
התאריך המבוקש.

@param {string} requestedStartTime
שעת ההתחלה.

@param {string} requestedEndTime
שעת הסיום.

@returns {Promise<Object|null>}
רשומת ההמתנה הפעילה או null.
---------------------------------------------------------
*/
async function getActiveSeatEntry(
  seatId,
  userId,
  requestedDate,
  requestedStartTime,
  requestedEndTime,
) {
  const sql = `
    SELECT
      queueSeatId,
      seatId,
      userId,

      DATE_FORMAT(
        requestedDate,
        '%Y-%m-%d'
      ) AS requestedDate,

      TIME_FORMAT(
        requestedStartTime,
        '%H:%i:%s'
      ) AS requestedStartTime,

      TIME_FORMAT(
        requestedEndTime,
        '%H:%i:%s'
      ) AS requestedEndTime,

      status,
      createdAt,
      offeredAt,
      offerExpiresAt

    FROM waiting_list_seat

    WHERE seatId = ?
      AND userId = ?
      AND requestedDate = ?
      AND requestedStartTime = ?
      AND requestedEndTime = ?

      AND status IN (
        'waiting',
        'offered'
      )

    ORDER BY
      createdAt ASC,
      queueSeatId ASC

    LIMIT 1
  `;

  const entries = await doQuery(sql, [
    seatId,
    userId,
    requestedDate,
    requestedStartTime,
    requestedEndTime,
  ]);

  return entries[0] || null;
}

/*
---------------------------------------------------------
addSeatEntry

תפקיד:
מוסיפה משתמש לסוף רשימת ההמתנה של
המקום והמועד המבוקשים.

המיקום בתור אינו נשמר ידנית.
הוא מחושב בזמן השליפה לפי createdAt
ו-queueSeatId.

@param {number} seatId
מזהה המקום.

@param {number} userId
מזהה המשתמש.

@param {string} requestedDate
התאריך המבוקש.

@param {string} requestedStartTime
שעת ההתחלה.

@param {string} requestedEndTime
שעת הסיום.

@returns {Promise<number>}
מזהה רשומת ההמתנה החדשה.
---------------------------------------------------------
*/
async function addSeatEntry(
  seatId,
  userId,
  requestedDate,
  requestedStartTime,
  requestedEndTime,
) {
  const sql = `
    INSERT INTO waiting_list_seat (
      seatId,
      userId,
      requestedDate,
      requestedStartTime,
      requestedEndTime,
      status
    )
    VALUES (?, ?, ?, ?, ?, 'waiting')
  `;

  const result = await doQuery(sql, [
    seatId,
    userId,
    requestedDate,
    requestedStartTime,
    requestedEndTime,
  ]);

  return result.insertId;
}

/*
---------------------------------------------------------
getUserSeatWaitingLists

תפקיד:
מחזירה את כל המתנות המקומות הפעילות
של משתמש מסוים.

התוצאה כוללת:
- פרטי המקום.
- התאריך והשעות.
- סטטוס ההמתנה.
- זמן תפוגת ההצעה.
- מיקום מחושב בתור.

משתמש שקיבל הצעה מופיע במקום 1.

@param {number} userId
מזהה המשתמש.

@returns {Promise<Array>}
מערך המתנות המקומות הפעילות.
---------------------------------------------------------
*/
async function getUserSeatWaitingLists(userId) {
  const sql = `
    SELECT
      waiting.queueSeatId
        AS waitingId,

      'seat'
        AS waitingType,

      waiting.seatId,

      seat.location,

      seat.type
        AS seatType,

      DATE_FORMAT(
        waiting.requestedDate,
        '%Y-%m-%d'
      ) AS requestedDate,

      TIME_FORMAT(
        waiting.requestedStartTime,
        '%H:%i:%s'
      ) AS requestedStartTime,

      TIME_FORMAT(
        waiting.requestedEndTime,
        '%H:%i:%s'
      ) AS requestedEndTime,

      waiting.status,

      waiting.createdAt,

      waiting.offerExpiresAt,

      CASE
        WHEN waiting.status = 'waiting'
        THEN (
          SELECT COUNT(*) + 1

          FROM waiting_list_seat
            AS earlier

          WHERE earlier.seatId =
              waiting.seatId

            AND earlier.requestedDate =
              waiting.requestedDate

            AND earlier.requestedStartTime =
              waiting.requestedStartTime

            AND earlier.requestedEndTime =
              waiting.requestedEndTime

            AND earlier.status =
              'waiting'

            AND (
              earlier.createdAt <
                waiting.createdAt

              OR (
                earlier.createdAt =
                  waiting.createdAt

                AND earlier.queueSeatId <
                  waiting.queueSeatId
              )
            )
        )

        WHEN waiting.status = 'offered'
        THEN 1

        ELSE NULL
      END AS position

    FROM waiting_list_seat
      AS waiting

    INNER JOIN seat
      ON seat.seatId =
        waiting.seatId

    WHERE waiting.userId = ?

      AND waiting.status IN (
        'waiting',
        'offered'
      )

    ORDER BY
      waiting.createdAt DESC,
      waiting.queueSeatId DESC
  `;

  return doQuery(sql, [userId]);
}

/*
---------------------------------------------------------
getAllSeatWaitingLists

תפקיד:
מחזירה לספרנית את כל המתנות המקומות הפעילות.

הנתונים כוללים:
- מקום ואזור.
- משתמש וכתובת מייל.
- תאריך ושעות.
- סטטוס ההמתנה.
- זמן יצירה ותפוגה.

@returns {Promise<Array>}
מערך כל המתנות המקומות הפעילות.
---------------------------------------------------------
*/
async function getAllSeatWaitingLists() {
  const sql = `
    SELECT
      waiting.queueSeatId
        AS waitingId,

      waiting.seatId,

      seat.location,

      seat.type
        AS seatType,

      user.userId,

      user.fullName,

      user.email,

      DATE_FORMAT(
        waiting.requestedDate,
        '%Y-%m-%d'
      ) AS requestedDate,

      TIME_FORMAT(
        waiting.requestedStartTime,
        '%H:%i:%s'
      ) AS requestedStartTime,

      TIME_FORMAT(
        waiting.requestedEndTime,
        '%H:%i:%s'
      ) AS requestedEndTime,

      waiting.status,

      waiting.createdAt,

      waiting.offerExpiresAt

    FROM waiting_list_seat
      AS waiting

    INNER JOIN seat
      ON seat.seatId =
        waiting.seatId

    INNER JOIN user
      ON user.userId =
        waiting.userId

    WHERE waiting.status IN (
      'waiting',
      'offered'
    )

    ORDER BY
      waiting.requestedDate ASC,
      waiting.requestedStartTime ASC,
      waiting.createdAt ASC,
      waiting.queueSeatId ASC
  `;

  return doQuery(sql);
}

/*
---------------------------------------------------------
cancelSeatEntry

תפקיד:
מבטלת המתנת מקום השייכת למשתמש המחובר.

ניתן לבטל רק רשומה בסטטוס:
- waiting
- offered

@param {number} waitingId
מזהה רשומת ההמתנה.

@param {number} userId
מזהה המשתמש.

@param {string} cancelledAt
מועד הביטול לפי שעון ישראל.

@returns {Promise<Object>}
תוצאת פעולת ה-UPDATE.
---------------------------------------------------------
*/
async function cancelSeatEntry(waitingId, userId, cancelledAt) {
  const sql = `
    UPDATE waiting_list_seat

    SET
      status = 'cancelled',
      cancelledAt = ?

    WHERE queueSeatId = ?
      AND userId = ?

      AND status IN (
        'waiting',
        'offered'
      )
  `;

  return doQuery(sql, [cancelledAt, waitingId, userId]);
}

/*
---------------------------------------------------------
getFirstWaitingForSeat

תפקיד:
מחזירה את המשתמש הראשון שממתין לאותו
מקום ובאותו מועד.

סדר התור נקבע לפי:
1. createdAt.
2. queueSeatId.

התוצאה כוללת שם ומייל לצורך יצירת
התראה ושליחת מייל.

@param {number} seatId
מזהה המקום.

@param {string} requestedDate
התאריך המבוקש.

@param {string} requestedStartTime
שעת ההתחלה.

@param {string} requestedEndTime
שעת הסיום.

@returns {Promise<Object|null>}
המשתמש הראשון בתור או null.
---------------------------------------------------------
*/
async function getFirstWaitingForSeat(
  seatId,
  requestedDate,
  requestedStartTime,
  requestedEndTime,
) {
  const sql = `
    SELECT
      waiting.queueSeatId,
      waiting.seatId,
      waiting.userId,

      DATE_FORMAT(
        waiting.requestedDate,
        '%Y-%m-%d'
      ) AS requestedDate,

      TIME_FORMAT(
        waiting.requestedStartTime,
        '%H:%i:%s'
      ) AS requestedStartTime,

      TIME_FORMAT(
        waiting.requestedEndTime,
        '%H:%i:%s'
      ) AS requestedEndTime,

      seat.location,

      user.fullName,

      user.email

    FROM waiting_list_seat
      AS waiting

    INNER JOIN seat
      ON seat.seatId =
        waiting.seatId

    INNER JOIN user
      ON user.userId =
        waiting.userId

    WHERE waiting.seatId = ?
      AND waiting.requestedDate = ?
      AND waiting.requestedStartTime = ?
      AND waiting.requestedEndTime = ?
      AND waiting.status = 'waiting'

    ORDER BY
      waiting.createdAt ASC,
      waiting.queueSeatId ASC

    LIMIT 1
  `;

  const entries = await doQuery(sql, [
    seatId,
    requestedDate,
    requestedStartTime,
    requestedEndTime,
  ]);

  return entries[0] || null;
}

/*
---------------------------------------------------------
offerSeatEntry

תפקיד:
מעבירה את הראשון בתור מ-waiting ל-offered.

נשמרים:
- זמן יצירת ההצעה.
- זמן תפוגת ההצעה.

@param {number} waitingId
מזהה רשומת ההמתנה.

@param {string} offeredAt
מועד יצירת ההצעה.

@param {string} expiresAt
מועד תפוגת ההצעה.

@returns {Promise<Object>}
תוצאת פעולת ה-UPDATE.
---------------------------------------------------------
*/
async function offerSeatEntry(waitingId, offeredAt, expiresAt) {
  const sql = `
    UPDATE waiting_list_seat

    SET
      status = 'offered',
      offeredAt = ?,
      offerExpiresAt = ?

    WHERE queueSeatId = ?
      AND status = 'waiting'
  `;

  return doQuery(sql, [offeredAt, expiresAt, waitingId]);
}

/*
---------------------------------------------------------
getSeatOffer

תפקיד:
מחזירה הצעת מקום פעילה של משתמש מסוים.

ההצעה חייבת להתאים בדיוק:
- למקום.
- לתאריך.
- לשעת ההתחלה.
- לשעת הסיום.

@param {number} seatId
מזהה המקום.

@param {number} userId
מזהה המשתמש.

@param {string} requestedDate
התאריך המבוקש.

@param {string} requestedStartTime
שעת ההתחלה.

@param {string} requestedEndTime
שעת הסיום.

@param {string} currentDateTime
המועד הנוכחי לפי שעון ישראל.

@returns {Promise<Object|null>}
ההצעה הפעילה או null.
---------------------------------------------------------
*/
async function getSeatOffer(
  seatId,
  userId,
  requestedDate,
  requestedStartTime,
  requestedEndTime,
  currentDateTime,
) {
  const sql = `
    SELECT queueSeatId

    FROM waiting_list_seat

    WHERE seatId = ?
      AND userId = ?
      AND requestedDate = ?
      AND requestedStartTime = ?
      AND requestedEndTime = ?
      AND status = 'offered'
      AND offerExpiresAt > ?

    LIMIT 1
  `;

  const offers = await doQuery(sql, [
    seatId,
    userId,
    requestedDate,
    requestedStartTime,
    requestedEndTime,
    currentDateTime,
  ]);

  return offers[0] || null;
}

/*
---------------------------------------------------------
hasActiveSeatOffer

תפקיד:
בודקת אם קיימת הצעה פעילה כלשהי עבור
המקום והמועד המבוקשים.

בזמן שהצעה פעילה:
רק המשתמש שקיבל אותה רשאי להזמין את המקום.

@param {number} seatId
מזהה המקום.

@param {string} requestedDate
התאריך המבוקש.

@param {string} requestedStartTime
שעת ההתחלה.

@param {string} requestedEndTime
שעת הסיום.

@param {string} currentDateTime
המועד הנוכחי לפי שעון ישראל.

@returns {Promise<boolean>}
true אם קיימת הצעה פעילה.
---------------------------------------------------------
*/
async function hasActiveSeatOffer(
  seatId,
  requestedDate,
  requestedStartTime,
  requestedEndTime,
  currentDateTime,
) {
  const sql = `
    SELECT queueSeatId

    FROM waiting_list_seat

    WHERE seatId = ?
      AND requestedDate = ?
      AND requestedStartTime = ?
      AND requestedEndTime = ?
      AND status = 'offered'
      AND offerExpiresAt > ?

    LIMIT 1
  `;

  const offers = await doQuery(sql, [
    seatId,
    requestedDate,
    requestedStartTime,
    requestedEndTime,
    currentDateTime,
  ]);

  return offers.length > 0;
}

module.exports = {
  getSeat,
  hasSeatReservation,
  getActiveSeatEntry,
  addSeatEntry,
  getUserSeatWaitingLists,
  getAllSeatWaitingLists,
  cancelSeatEntry,
  getFirstWaitingForSeat,
  offerSeatEntry,
  getSeatOffer,
  hasActiveSeatOffer,
};
