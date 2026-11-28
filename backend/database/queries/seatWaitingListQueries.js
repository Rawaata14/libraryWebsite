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

const { doQuery } = require("../query");

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
getSeatForUpdate

תפקיד:
שליפת כיסא ונעילתו במסגרת טרנזקציה,
לצורך סנכרון בין הזמנות להצעות מרשימת ההמתנה.
---------------------------------------------------------
*/
async function getSeatForUpdate(seatId, connection) {
  if (!connection) {
    throw new Error("A transaction connection is required to lock a seat.");
  }

  const sql = `
    SELECT seatId, type, status
    FROM seat
    WHERE seatId = ?
    LIMIT 1
    FOR UPDATE
  `;

  const seats = await doQuery(sql, [seatId], connection);

  return seats[0] || null;
}

// בודקת אם קיימת הזמנה לא מבוטלת החופפת למקום ולמועד המבוקשים, עם אפשרות לסינון לפי משתמש ולנעילת הרשומה במסגרת טרנזקציה.
async function hasSeatReservation(
  seatId,
  requestedDate,
  requestedStartTime,
  requestedEndTime,
  connection = null,
  userId = null,
) {
  const sql = `
    SELECT reservationId
    FROM seat_reservation
    WHERE seatId = ?
      AND reservationDate = ?
      AND LOWER(status) NOT IN ('cancelled', 'canceled')
      AND startTime < ?
      AND endTime > ?
      ${userId !== null ? "AND userId = ?" : ""}
    LIMIT 1
    ${connection ? "FOR UPDATE" : ""}
  `;

  const params = [seatId, requestedDate, requestedEndTime, requestedStartTime];

  if (userId !== null) {
    params.push(userId);
  }

  const reservations = await doQuery(sql, params, connection);

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
  connection = null,
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
    ${connection ? "FOR UPDATE" : ""}
  `;

  const entries = await doQuery(
    sql,
    [seatId, userId, requestedDate, requestedStartTime, requestedEndTime],
    connection,
  );

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
  connection = null,
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

  const result = await doQuery(
    sql,
    [seatId, userId, requestedDate, requestedStartTime, requestedEndTime],
    connection,
  );

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

          WHERE (
              (waiting.seatId IS NULL AND earlier.seatId IS NULL)
              OR (earlier.seatId = waiting.seatId)
            )

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

    LEFT JOIN seat
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
        requestedStartTime,
        '%H:%i:%s'
      ) AS requestedStartTime,

      TIME_FORMAT(
        requestedEndTime,
        '%H:%i:%s'
      ) AS requestedEndTime,

      waiting.status,

      waiting.createdAt,

      waiting.offerExpiresAt,

      -- חישוב המיקום בתור למקומות (לפי מקום וחלון זמן, או תור כללי אם seatId ריק)
      ROW_NUMBER() OVER (
        PARTITION BY waiting.seatId, waiting.requestedDate, waiting.requestedStartTime, waiting.requestedEndTime
        ORDER BY
          waiting.createdAt ASC,
          waiting.queueSeatId ASC
      ) AS position

    FROM waiting_list_seat
      AS waiting

    LEFT JOIN seat
      ON seat.seatId =
        waiting.seatId

    LEFT JOIN user
      ON user.userId =
        waiting.userId

    ORDER BY
      waiting.requestedDate DESC,
      waiting.requestedStartTime DESC,
      waiting.createdAt DESC,
      waiting.queueSeatId DESC
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
  connection = null,
) {
  // בחירת הרשומה הראשונה ונעילת רשומות ההמתנה בלבד
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
      ) AS requestedEndTime

    FROM waiting_list_seat

    WHERE (seatId IS NULL OR seatId = ?)
      AND requestedDate = ?
      AND requestedStartTime = ?
      AND requestedEndTime = ?
      AND status = 'waiting'

    ORDER BY
      createdAt ASC,
      queueSeatId ASC

    LIMIT 1
    ${connection ? "FOR UPDATE" : ""}
  `;

  const entries = await doQuery(
    sql,
    [seatId, requestedDate, requestedStartTime, requestedEndTime],
    connection,
  );

  const entry = entries[0];

  if (!entry) {
    return null;
  }

  // שליפת פרטי המשתמש ללא נעילה מפורשת
  const users = await doQuery(
    `
      SELECT fullName, email
      FROM user
      WHERE userId = ?
      LIMIT 1
    `,
    [entry.userId],
    connection,
  );

  if (!users[0]) {
    return null;
  }

  // שליפת מיקום הכיסא ללא נעילה נוספת
  const seats = await doQuery(
    `
      SELECT location
      FROM seat
      WHERE seatId = ?
      LIMIT 1
    `,
    [seatId],
    connection,
  );

  return {
    ...entry,
    seatId,
    location: seats[0]?.location ?? null,
    fullName: users[0].fullName,
    email: users[0].email,
  };
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
async function offerSeatEntry(
  waitingId,
  offeredAt,
  expiresAt,
  seatId = null,
  connection = null,
) {
  const sql = `
    UPDATE waiting_list_seat
    SET
      status = 'offered',
      seatId = COALESCE(seatId, ?),
      offeredAt = ?,
      offerExpiresAt = ?
    WHERE queueSeatId = ?
      AND status = 'waiting'
      AND (seatId IS NULL OR ? IS NULL OR seatId = ?)
  `;

  return doQuery(
    sql,
    [seatId, offeredAt, expiresAt, waitingId, seatId, seatId],
    connection,
  );
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
  connection = null,
) {
  const sql = `
    SELECT queueSeatId
    FROM waiting_list_seat
    WHERE seatId = ?
      AND requestedDate = ?
      AND requestedStartTime < ?
      AND requestedEndTime > ?
      AND status = 'offered'
      AND offerExpiresAt > ?
    LIMIT 1
    ${connection ? "FOR UPDATE" : ""}
  `;

  const offers = await doQuery(
    sql,
    [
      seatId,
      requestedDate,
      requestedEndTime,
      requestedStartTime,
      currentDateTime,
    ],
    connection,
  );

  return offers.length > 0;
}

/*
---------------------------------------------------------
cancelSeatEntryByLibrarian

תפקיד:
מעדכנת את סטטוס רשומת ההמתנה למקום ל-'cancelled' 
על ידי ספרנית (ביטול ידני/ניהולי).

@param {number} queueSeatId
מזהה רשומת ההמתנה למקום.

@returns {Promise<Object>}
תוצאת ההרצה של שאילתת ה-UPDATE מול מסד הנתונים.
---------------------------------------------------------
*/
async function cancelSeatEntryByLibrarian(queueSeatId) {
  const sql = `
    UPDATE waiting_list_seat
    SET
      status = 'cancelled'
    WHERE queueSeatId = ?
  `;

  return doQuery(sql, [queueSeatId]);
}

module.exports = {
  getSeat,
  getSeatForUpdate,
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
  cancelSeatEntryByLibrarian,
};
