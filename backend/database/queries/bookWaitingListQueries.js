/*
=========================================================
bookWaitingListQueries.js

תיאור הקובץ:
שכבת השאילתות של רשימת ההמתנה לספרים.

אחריות:
- שליפת ספר ובדיקת המלאי שלו.
- אימות הזמנת המקום שנבחרה.
- הוספת משתמש לרשימת המתנה.
- מניעת המתנה כפולה פעילה.
- שליפת ההמתנות של משתמש.
- שליפת ההמתנות עבור ספרנית.
- ביטול המתנה.
- בחירת המשתמש הראשון בתור.
- יצירת הצעה מוגבלת בזמן.
- בדיקת הרשאה למימוש הצעה.

למה הקובץ נפרד:
פעולות המתנת הספר שונות מפעולות המתנת
המקום. ההפרדה מונעת יצירת קובץ Queries
אחד גדול וכבד.
=========================================================
*/

const doQuery = require("../query");

/*
---------------------------------------------------------
getBook

תפקיד:
מחזירה את פרטי הספר הנדרשים לצורך רשימת
ההמתנה.

המידע כולל:
- מזהה הספר.
- שם הספר.
- מספר העותקים הזמינים.

@param {number} bookId
מזהה הספר הפנימי.

@returns {Promise<Object|null>}
מחזירה את הספר או null אם הוא אינו קיים.
---------------------------------------------------------
*/
async function getBook(bookId) {
  const sql = `
    SELECT
      bookId,
      title,
      available_quantity
    FROM book
    WHERE bookId = ?
    LIMIT 1
  `;

  const books = await doQuery(sql, [bookId]);

  return books[0] || null;
}

/*
---------------------------------------------------------
getActiveBookEntry

תפקיד:
בודקת אם למשתמש כבר קיימת המתנה פעילה
לאותו ספר.

סטטוסים פעילים:
- waiting
- offered

כך משתמש אינו יכול להירשם פעמיים לאותה
רשימה בזמן שההמתנה הקודמת עדיין פעילה.

@param {number} bookId
מזהה הספר.

@param {number} userId
מזהה המשתמש.

@returns {Promise<Object|null>}
מחזירה את רשומת ההמתנה הפעילה או null.
---------------------------------------------------------
*/
async function getActiveBookEntry(bookId, userId) {
  const sql = `
    SELECT
      queueBookId,
      bookId,
      userId,
      seatReservationId,
      status,
      createdAt,
      offeredAt,
      offerExpiresAt
    FROM waiting_list_book
    WHERE bookId = ?
      AND userId = ?
      AND status IN (
        'waiting',
        'offered'
      )
    ORDER BY
      createdAt ASC,
      queueBookId ASC
    LIMIT 1
  `;

  const entries = await doQuery(sql, [bookId, userId]);

  return entries[0] || null;
}

/*
---------------------------------------------------------
getEligibleSeatReservation

תפקיד:
בודקת שהזמנת המקום שנבחרה עבור הספר:

- קיימת.
- שייכת למשתמש המחובר.
- נמצאת בסטטוס פעיל.
- עדיין לא הסתיימה.

למה הבדיקה נדרשת:
לפי דרישות הפרויקט, ספר ניתן לשימוש רק
במסגרת הזמנת מקום תקפה בספרייה.

@param {number} reservationId
מזהה הזמנת המקום.

@param {number} userId
מזהה המשתמש המחובר.

@param {string} libraryDate
התאריך הנוכחי לפי שעון ישראל.

@param {string} libraryTime
השעה הנוכחית לפי שעון ישראל.

@returns {Promise<Object|null>}
מחזירה את ההזמנה התקפה או null.
---------------------------------------------------------
*/
async function getEligibleSeatReservation(
  reservationId,
  userId,
  libraryDate,
  libraryTime,
) {
  const sql = `
    SELECT
      reservationId,
      seatId,

      DATE_FORMAT(
        reservationDate,
        '%Y-%m-%d'
      ) AS reservationDate,

      TIME_FORMAT(
        startTime,
        '%H:%i:%s'
      ) AS startTime,

      TIME_FORMAT(
        endTime,
        '%H:%i:%s'
      ) AS endTime

    FROM seat_reservation

    WHERE reservationId = ?
      AND userId = ?

      AND LOWER(status) IN (
        'pending',
        'active',
        'occupied',
        'confirmed'
      )

      AND (
        reservationDate > ?

        OR (
          reservationDate = ?
          AND endTime > ?
        )
      )

    LIMIT 1
  `;

  const reservations = await doQuery(sql, [
    reservationId,
    userId,
    libraryDate,
    libraryDate,
    libraryTime,
  ]);

  return reservations[0] || null;
}

/*
---------------------------------------------------------
addBookEntry

תפקיד:
מוסיפה משתמש לסוף רשימת ההמתנה של ספר.

ההמתנה נשמרת יחד עם הזמנת המקום שנבחרה,
כדי שהמשתמש יוכל לממש את הספר במסגרת
אותה הזמנה.

המיקום בתור אינו נשמר ידנית.
הוא מחושב בזמן השליפה לפי createdAt
ו-queueBookId.

@param {number} bookId
מזהה הספר.

@param {number} userId
מזהה המשתמש.

@param {number} seatReservationId
מזהה הזמנת המקום שנבחרה.

@returns {Promise<number>}
מחזירה את מזהה רשומת ההמתנה החדשה.
---------------------------------------------------------
*/
async function addBookEntry(bookId, userId, seatReservationId) {
  const sql = `
    INSERT INTO waiting_list_book (
      bookId,
      userId,
      seatReservationId,
      status
    )
    VALUES (?, ?, ?, 'waiting')
  `;

  const result = await doQuery(sql, [bookId, userId, seatReservationId]);

  return result.insertId;
}

/*
---------------------------------------------------------
getUserBookWaitingLists

תפקיד:
מחזירה את כל המתנות הספרים הפעילות של
משתמש מסוים.

התוצאה כוללת:
- פרטי הספר.
- הזמנת המקום המקושרת.
- סטטוס ההמתנה.
- זמן תפוגת ההצעה.
- מיקום מחושב בתור.

מיקום בתור:
נספרות רק רשומות waiting שנכנסו לפני
הרשומה הנוכחית.

משתמש שקיבל הצעה מופיע במקום 1.

@param {number} userId
מזהה המשתמש.

@returns {Promise<Array>}
מערך המתנות הספרים הפעילות.
---------------------------------------------------------
*/
async function getUserBookWaitingLists(userId) {
  const sql = `
    SELECT
      waiting.queueBookId
        AS waitingId,

      'book'
        AS waitingType,

      waiting.bookId,

      waiting.seatReservationId,

      book.title,

      book.author,

      DATE_FORMAT(
        reservation.reservationDate,
        '%Y-%m-%d'
      ) AS reservationDate,

      TIME_FORMAT(
        reservation.startTime,
        '%H:%i:%s'
      ) AS reservationStartTime,

      TIME_FORMAT(
        reservation.endTime,
        '%H:%i:%s'
      ) AS reservationEndTime,

      waiting.status,

      waiting.createdAt,

      waiting.offerExpiresAt,

      CASE
        WHEN waiting.status = 'waiting'
        THEN (
          SELECT COUNT(*) + 1

          FROM waiting_list_book
            AS earlier

          WHERE earlier.bookId =
            waiting.bookId

            AND earlier.status =
              'waiting'

            AND (
              earlier.createdAt <
                waiting.createdAt

              OR (
                earlier.createdAt =
                  waiting.createdAt

                AND earlier.queueBookId <
                  waiting.queueBookId
              )
            )
        )

        WHEN waiting.status = 'offered'
        THEN 1

        ELSE NULL
      END AS position

    FROM waiting_list_book
      AS waiting

    INNER JOIN book
      ON book.bookId =
        waiting.bookId

    INNER JOIN seat_reservation
      AS reservation
      ON reservation.reservationId =
        waiting.seatReservationId

    WHERE waiting.userId = ?

      AND waiting.status IN (
        'waiting',
        'offered'
      )

    ORDER BY
      waiting.createdAt DESC,
      waiting.queueBookId DESC
  `;

  return doQuery(sql, [userId]);
}

/*
---------------------------------------------------------
getAllBookWaitingLists

תפקיד:
מחזירה לספרנית את כל המתנות הספרים הפעילות.

הנתונים כוללים:
- הספר.
- המשתמש.
- כתובת המייל.
- הזמנת המקום.
- סטטוס ההמתנה.
- זמני יצירה ותפוגה.

@returns {Promise<Array>}
מערך כל המתנות הספרים הפעילות.
---------------------------------------------------------
*/
async function getAllBookWaitingLists() {
  const sql = `
    SELECT
      waiting.queueBookId
        AS waitingId,

      waiting.bookId,

      waiting.seatReservationId,

      book.title,

      user.userId,

      user.fullName,

      user.email,

      DATE_FORMAT(
        reservation.reservationDate,
        '%Y-%m-%d'
      ) AS reservationDate,

      TIME_FORMAT(
        reservation.startTime,
        '%H:%i:%s'
      ) AS reservationStartTime,

      TIME_FORMAT(
        reservation.endTime,
        '%H:%i:%s'
      ) AS reservationEndTime,

      waiting.status,

      waiting.createdAt,

      waiting.offerExpiresAt

    FROM waiting_list_book
      AS waiting

    INNER JOIN book
      ON book.bookId =
        waiting.bookId

    INNER JOIN user
      ON user.userId =
        waiting.userId

    INNER JOIN seat_reservation
      AS reservation
      ON reservation.reservationId =
        waiting.seatReservationId

    WHERE waiting.status IN (
      'waiting',
      'offered'
    )

    ORDER BY
      book.title ASC,
      waiting.createdAt ASC,
      waiting.queueBookId ASC
  `;

  return doQuery(sql);
}

/*
---------------------------------------------------------
cancelBookEntry

תפקיד:
מבטלת המתנת ספר השייכת למשתמש המחובר.

הבדיקה לפי userId מונעת ממשתמש לבטל
המתנה של משתמש אחר.

ניתן לבטל רק רשומה בסטטוס:
- waiting
- offered

@param {number} waitingId
מזהה רשומת ההמתנה.

@param {number} userId
מזהה המשתמש המחובר.

@param {string} cancelledAt
זמן הביטול לפי שעון ישראל.

@returns {Promise<Object>}
תוצאת פעולת ה-UPDATE.
---------------------------------------------------------
*/
async function cancelBookEntry(waitingId, userId, cancelledAt) {
  const sql = `
    UPDATE waiting_list_book

    SET
      status = 'cancelled',
      cancelledAt = ?

    WHERE queueBookId = ?
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
getFirstWaitingForBook

תפקיד:
מחזירה את המשתמש הראשון שממתין לספר.

סדר התור נקבע לפי:
1. createdAt.
2. queueBookId.

queueBookId משמש כשובר שוויון אם שתי רשומות
נוצרו באותה שנייה.

התוצאה כוללת גם שם ומייל לצורך יצירת
התראה ושליחת מייל.

@param {number} bookId
מזהה הספר.

@returns {Promise<Object|null>}
המשתמש הראשון בתור או null.
---------------------------------------------------------
*/
async function getFirstWaitingForBook(bookId) {
  const sql = `
    SELECT
      waiting.queueBookId,
      waiting.bookId,
      waiting.userId,
      waiting.seatReservationId,

      book.title,

      user.fullName,

      user.email

    FROM waiting_list_book
      AS waiting

    INNER JOIN book
      ON book.bookId =
        waiting.bookId

    INNER JOIN user
      ON user.userId =
        waiting.userId

    WHERE waiting.bookId = ?
      AND waiting.status = 'waiting'

    ORDER BY
      waiting.createdAt ASC,
      waiting.queueBookId ASC

    LIMIT 1
  `;

  const entries = await doQuery(sql, [bookId]);

  return entries[0] || null;
}

/*
---------------------------------------------------------
offerBookEntry

תפקיד:
מעבירה את המשתמש הראשון בתור מ-waiting
ל-offered.

נשמרים:
- זמן יצירת ההצעה.
- זמן תפוגת ההצעה.

תנאי status='waiting' מונע משתי פעולות
לעדכן שוב רשומה שכבר קיבלה הצעה.

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
async function offerBookEntry(waitingId, offeredAt, expiresAt) {
  const sql = `
    UPDATE waiting_list_book

    SET
      status = 'offered',
      offeredAt = ?,
      offerExpiresAt = ?

    WHERE queueBookId = ?
      AND status = 'waiting'
  `;

  return doQuery(sql, [offeredAt, expiresAt, waitingId]);
}

/*
---------------------------------------------------------
getBookOffer

תפקיד:
מחזירה הצעת ספר פעילה של משתמש מסוים.

הצעה נחשבת פעילה אם:
- הסטטוס offered.
- זמן התפוגה עדיין לא הגיע.

seatReservationId מוחזר כדי לוודא שהמשתמש
מממש את הספר באמצעות הזמנת המקום שאליה
ההמתנה קושרה.

@param {number} bookId
מזהה הספר.

@param {number} userId
מזהה המשתמש.

@param {string} currentDateTime
המועד הנוכחי לפי שעון ישראל.

@returns {Promise<Object|null>}
ההצעה הפעילה או null.
---------------------------------------------------------
*/
async function getBookOffer(bookId, userId, currentDateTime) {
  const sql = `
    SELECT
      queueBookId,
      seatReservationId

    FROM waiting_list_book

    WHERE bookId = ?
      AND userId = ?
      AND status = 'offered'
      AND offerExpiresAt > ?

    LIMIT 1
  `;

  const offers = await doQuery(sql, [bookId, userId, currentDateTime]);

  return offers[0] || null;
}

/*
---------------------------------------------------------
hasActiveBookOffer

תפקיד:
בודקת אם קיימת כרגע הצעה פעילה כלשהי
עבור הספר.

למה הבדיקה נדרשת:
בזמן שהספר מוצע לראשון בתור, משתמש אחר
אינו רשאי להזמין את העותק לפני שתוקף
ההצעה מסתיים.

@param {number} bookId
מזהה הספר.

@param {string} currentDateTime
המועד הנוכחי לפי שעון ישראל.

@returns {Promise<boolean>}
true אם קיימת הצעה פעילה.
---------------------------------------------------------
*/
async function hasActiveBookOffer(bookId, currentDateTime) {
  const sql = `
    SELECT queueBookId

    FROM waiting_list_book

    WHERE bookId = ?
      AND status = 'offered'
      AND offerExpiresAt > ?

    LIMIT 1
  `;

  const offers = await doQuery(sql, [bookId, currentDateTime]);

  return offers.length > 0;
}

module.exports = {
  getBook,
  getActiveBookEntry,
  getEligibleSeatReservation,
  addBookEntry,
  getUserBookWaitingLists,
  getAllBookWaitingLists,
  cancelBookEntry,
  getFirstWaitingForBook,
  offerBookEntry,
  getBookOffer,
  hasActiveBookOffer,
};
