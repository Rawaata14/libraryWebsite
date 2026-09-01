/*
=========================================================
waitingListMaintenanceQueries.js

תיאור הקובץ:
שכבת שאילתות התחזוקה של רשימות ההמתנה.

אחריות:
- איתור הצעות שפג תוקפן.
- סימון הצעות כ-expired.
- סימון הצעה כ-completed לאחר הזמנה.
- סיום אוטומטי של השאלות ספרים.
- החזרת עותקים למלאי.
- טיפול בספרים המקושרים להזמנת מקום שבוטלה.
- ביטול המתנות ספרים שאינן ניתנות עוד למימוש.

למה הקובץ נפרד:
הפעולות בקובץ זה מופעלות בעיקר על ידי
המתזמן או בעקבות ביטול הזמנה, ולא ישירות
מתוך מסכי המשתמש.
=========================================================
*/

const doQuery = require("../query");

const { getConnection } = require("../dbSingleton");

/*
---------------------------------------------------------
getExpiredBookOffers

תפקיד:
מחזירה הצעות ספרים שפג תוקפן.

הצעה נחשבת שפגה כאשר:
- הסטטוס שלה offered.
- offerExpiresAt קטן או שווה למועד הנוכחי.

@param {string} currentDateTime
המועד הנוכחי לפי שעון ישראל.

@returns {Promise<Array>}
מערך הצעות הספרים שפג תוקפן.
---------------------------------------------------------
*/
async function getExpiredBookOffers(currentDateTime) {
  const sql = `
    SELECT
      queueBookId,
      bookId

    FROM waiting_list_book

    WHERE status = 'offered'
      AND offerExpiresAt <= ?
  `;

  return doQuery(sql, [currentDateTime]);
}

/*
---------------------------------------------------------
getExpiredSeatOffers

תפקיד:
מחזירה הצעות מקומות שפג תוקפן.

הנתונים כוללים את המקום והתאריך והשעות,
כדי שאפשר יהיה להעביר את ההצעה למשתמש
הבא שממתין לאותו מועד בדיוק.

@param {string} currentDateTime
המועד הנוכחי לפי שעון ישראל.

@returns {Promise<Array>}
מערך הצעות המקומות שפג תוקפן.
---------------------------------------------------------
*/
async function getExpiredSeatOffers(currentDateTime) {
  const sql = `
    SELECT
      queueSeatId,
      seatId,

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

    WHERE status = 'offered'
      AND offerExpiresAt <= ?
  `;

  return doQuery(sql, [currentDateTime]);
}

/*
---------------------------------------------------------
expireBookOffer

תפקיד:
מסמנת הצעת ספר שפג תוקפה כ-expired.

תנאי status='offered' מונע שינוי של רשומה
שכבר הושלמה או בוטלה.

@param {number} waitingId
מזהה המתנת הספר.

@returns {Promise<Object>}
תוצאת פעולת ה-UPDATE.
---------------------------------------------------------
*/
async function expireBookOffer(waitingId) {
  const sql = `
    UPDATE waiting_list_book

    SET status = 'expired'

    WHERE queueBookId = ?
      AND status = 'offered'
  `;

  return doQuery(sql, [waitingId]);
}

/*
---------------------------------------------------------
expireSeatOffer

תפקיד:
מסמנת הצעת מקום שפג תוקפה כ-expired.

@param {number} waitingId
מזהה המתנת המקום.

@returns {Promise<Object>}
תוצאת פעולת ה-UPDATE.
---------------------------------------------------------
*/
async function expireSeatOffer(waitingId) {
  const sql = `
    UPDATE waiting_list_seat

    SET status = 'expired'

    WHERE queueSeatId = ?
      AND status = 'offered'
  `;

  return doQuery(sql, [waitingId]);
}

/*
---------------------------------------------------------
completeBookOffer

תפקיד:
מסמנת הצעת ספר כ-completed לאחר שהמשתמש
הזמין את הספר בהצלחה.

הפעולה מתבצעת רק אם הרשומה עדיין offered.

@param {number} waitingId
מזהה המתנת הספר.

@param {string} completedAt
מועד השלמת ההצעה לפי שעון ישראל.

@returns {Promise<Object>}
תוצאת פעולת ה-UPDATE.
---------------------------------------------------------
*/
async function completeBookOffer(waitingId, completedAt) {
  const sql = `
    UPDATE waiting_list_book

    SET
      status = 'completed',
      completedAt = ?

    WHERE queueBookId = ?
      AND status = 'offered'
  `;

  return doQuery(sql, [completedAt, waitingId]);
}

/*
---------------------------------------------------------
completeSeatOffer

תפקיד:
מסמנת הצעת מקום כ-completed לאחר שהמשתמש
הזמין את המקום בהצלחה.

@param {number} waitingId
מזהה המתנת המקום.

@param {string} completedAt
מועד השלמת ההצעה לפי שעון ישראל.

@returns {Promise<Object>}
תוצאת פעולת ה-UPDATE.
---------------------------------------------------------
*/
async function completeSeatOffer(waitingId, completedAt) {
  const sql = `
    UPDATE waiting_list_seat

    SET
      status = 'completed',
      completedAt = ?

    WHERE queueSeatId = ?
      AND status = 'offered'
  `;

  return doQuery(sql, [completedAt, waitingId]);
}

/*
---------------------------------------------------------
releaseFinishedLoans

תפקיד:
מסיימת השאלות ספרים שהזמנת המקום שלהן
כבר הסתיימה ומחזירה כל עותק למלאי.

הפעולה מתבצעת בתוך Transaction נפרד לכל השאלה:

1. הסטטוס של ההשאלה משתנה מ-active ל-returned.
2. returnDate מתעדכן.
3. available_quantity של הספר גדל באחד.
4. הכמות הזמינה אינה יכולה לעבור את total_quantity.

למה נדרש Transaction:
אסור לעדכן את ההשאלה בלי לעדכן את המלאי,
או לעדכן את המלאי בלי לסיים את ההשאלה.

@param {string} libraryDate
התאריך הנוכחי לפי שעון ישראל.

@param {string} libraryTime
השעה הנוכחית לפי שעון ישראל.

@returns {Promise<Array<number>>}
מערך ייחודי של מזהי הספרים שחזרו למלאי.
---------------------------------------------------------
*/
async function releaseFinishedLoans(libraryDate, libraryTime) {
  const databasePool = await getConnection();

  /*
  תחילה מאתרים את כל ההשאלות הפעילות
  שזמן הזמנת המקום שלהן הסתיים.
  */
  const candidates = await doQuery(
    `
      SELECT
        loan.loanId,
        loan.bookId

      FROM loan

      INNER JOIN seat_reservation
        ON seat_reservation.reservationId =
          loan.seatReservationId

      WHERE loan.status = 'active'

        AND (
          seat_reservation.reservationDate < ?

          OR (
            seat_reservation.reservationDate = ?
            AND seat_reservation.endTime <= ?
          )
        )
    `,
    [libraryDate, libraryDate, libraryTime],
  );

  const releasedBookIds = [];

  /*
  כל השאלה מטופלת בנפרד.

  כך תקלה בהשאלה אחת אינה גורמת להחזרה
  כפולה של השאלה שכבר טופלה.
  */
  for (const candidate of candidates) {
    const connection = await databasePool.getConnection();

    try {
      await connection.beginTransaction();

      /*
      שינוי הסטטוס יתבצע רק אם ההשאלה
      עדיין active.

      affectedRows מגן מפני טיפול כפול
      על ידי שני מחזורי תחזוקה.
      */
      const [loanResult] = await connection.query(
        `
            UPDATE loan

            SET
              status = 'returned',
              returnDate = ?

            WHERE loanId = ?
              AND status = 'active'
          `,
        [libraryDate, candidate.loanId],
      );

      if (loanResult.affectedRows === 1) {
        /*
        החזרת עותק אחד למלאי.

        LEAST מונעת חריגה מעל הכמות הכוללת.
        */
        await connection.query(
          `
            UPDATE book

            SET available_quantity =
              LEAST(
                total_quantity,
                available_quantity + 1
              )

            WHERE bookId = ?
          `,
          [candidate.bookId],
        );

        releasedBookIds.push(candidate.bookId);
      }

      await connection.commit();
    } catch (error) {
      /*
      אם אחת הפעולות נכשלה, מבטלים
      את כל הפעולות של אותה השאלה.
      */
      await connection.rollback();

      throw error;
    } finally {
      connection.release();
    }
  }

  /*
  שימוש ב-Set מונע החזרת אותו bookId
  כמה פעמים כאשר כמה עותקים חזרו יחד.
  */
  return [...new Set(releasedBookIds)];
}

/*
---------------------------------------------------------
releaseLoansForReservation

תפקיד:
מחזירה מיד למלאי ספרים המקושרים להזמנת
מקום שבוטלה.

הפעולה כוללת:
1. נעילת ההשאלות הפעילות.
2. שינוי הסטטוס ל-returned.
3. החזרת העותקים למלאי.
4. ביטול המתנות ספרים הקשורות להזמנה.

למה returnDate מקבל את loanDate:
הזמנה עתידית עשויה להתבטל לפני תאריך
השימוש בספר.

במסד קיים אילוץ:
returnDate >= loanDate

לכן שימוש בתאריך הביטול עלול להפר את
האילוץ אם הביטול התרחש לפני loanDate.

@param {number} reservationId
מזהה הזמנת המקום שבוטלה.

@returns {Promise<Array<number>>}
מערך ייחודי של הספרים שחזרו למלאי.
---------------------------------------------------------
*/
async function releaseLoansForReservation(reservationId) {
  const databasePool = await getConnection();

  const connection = await databasePool.getConnection();

  try {
    await connection.beginTransaction();

    /*
    נעילת כל ההשאלות הפעילות המקושרות
    להזמנת המקום.
    */
    const [loans] = await connection.query(
      `
          SELECT
            loanId,
            bookId

          FROM loan

          WHERE seatReservationId = ?
            AND status = 'active'

          FOR UPDATE
        `,
      [reservationId],
    );

    const releasedBookIds = [];

    for (const loan of loans) {
      /*
      ההשאלה מסומנת כמוחזרת.

      returnDate מקבל את loanDate כדי לעמוד
      באילוץ התאריכים גם בביטול מוקדם.
      */
      const [loanResult] = await connection.query(
        `
            UPDATE loan

            SET
              status = 'returned',
              returnDate = loanDate

            WHERE loanId = ?
              AND status = 'active'
          `,
        [loan.loanId],
      );

      if (loanResult.affectedRows === 1) {
        await connection.query(
          `
            UPDATE book

            SET available_quantity =
              LEAST(
                total_quantity,
                available_quantity + 1
              )

            WHERE bookId = ?
          `,
          [loan.bookId],
        );

        releasedBookIds.push(loan.bookId);
      }
    }

    /*
    משתמש שהמתין לספר במסגרת הזמנת המקום
    שבוטלה אינו יכול עוד לממש את ההצעה.

    לכן ההמתנות הפעילות הקשורות להזמנה
    מסומנות כ-cancelled.
    */
    await connection.query(
      `
        UPDATE waiting_list_book

        SET
          status = 'cancelled',
          cancelledAt = CURRENT_TIMESTAMP

        WHERE seatReservationId = ?

          AND status IN (
            'waiting',
            'offered'
          )
      `,
      [reservationId],
    );

    await connection.commit();

    return [...new Set(releasedBookIds)];
  } catch (error) {
    await connection.rollback();

    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  getExpiredBookOffers,
  getExpiredSeatOffers,
  expireBookOffer,
  expireSeatOffer,
  completeBookOffer,
  completeSeatOffer,
  releaseFinishedLoans,
  releaseLoansForReservation,
};
