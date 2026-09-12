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

  for (const candidate of candidates) {
    const connection = await databasePool.getConnection();

    try {
      await connection.beginTransaction();

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
        // עצם עדכון הסטטוס ל-returned משחרר אוטומטית את העותק בחישוב הדינמי
        releasedBookIds.push(candidate.bookId);
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();

      throw error;
    } finally {
      connection.release();
    }
  }

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
        releasedBookIds.push(loan.bookId);
      }
    }

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

/*
---------------------------------------------------------
flagOverdueLoansAndNotify

תפקיד:
1. מאתרת השאלות פעילות שזמן ההחזרה (dueDate) שלהן עבר.
2. מעדכנת את הסטטוס שלהן לֵ-'overdue'.
3. יוצרת התראה לכל הספרנים במערכת על הספרים שלא הוחזרו.
---------------------------------------------------------
*/
async function flagOverdueLoansAndNotify(currentDateTime) {
  // א. שליפת ההשאלות הפעילות שזמנן עבר
  const findSql = `
    SELECT loan.loanId, loan.userId, loan.bookId, loan.dueDate, book.title AS bookTitle
    FROM loan
    INNER JOIN book ON loan.bookId = book.bookId
    WHERE loan.status = 'active'
      AND loan.dueDate <= ?
  `;
  const overdueLoans = await doQuery(findSql, [currentDateTime]);

  if (!overdueLoans || overdueLoans.length === 0) {
    return [];
  }

  // ב. עדכון הסטטוס שלהן ל-overdue
  const loanIds = overdueLoans.map((loan) => loan.loanId);
  const placeholders = loanIds.map(() => "?").join(", ");

  const updateSql = `
    UPDATE loan
    SET status = 'overdue'
    WHERE loanId IN (${placeholders})
  `;
  await doQuery(updateSql, loanIds);

  // ג. איתור כל משתמשי ה-Librarian כדי לשלוח אליהם התראה
  const librariansSql = `
    SELECT userId FROM user WHERE role = 'librarian'
  `;
  const librarians = await doQuery(librariansSql);

  // ד. יצירת התראות לכל ספרנית עבור כל השאילתות שבאיחור
  if (librarians && librarians.length > 0) {
    for (const loan of overdueLoans) {
      for (const lib of librarians) {
        const notifSql = `
          INSERT INTO notification (userId, message, sentDate, type, isRead)
          VALUES (?, ?, ?, 'overdue_loan', 0)
        `;
        // חילוץ תאריך נקי בלבד (ללא אזורי זמן ארוכים ומבלבלים)
        const formattedDate = loan.dueDate
          ? String(loan.dueDate).split("T")[0]
          : "N/A";

        const message = `The book "${loan.bookTitle || "Book #" + loan.bookId}" (Loan #${loan.loanId}) is overdue. Due date was: ${formattedDate}.`;
        await doQuery(notifSql, [lib.userId, message, currentDateTime]);
      }
    }
  }

  return loanIds;
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
  flagOverdueLoansAndNotify,
};
