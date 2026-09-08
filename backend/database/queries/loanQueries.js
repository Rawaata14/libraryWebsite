/*
=========================================================
loanQueries.js

תיאור הקובץ:
שכבת השאילתות והלוגיקה של ניהול השאלות ושריונים במערכת.

אחריות:
- יצירת שריון והשאלה לספר (כולל בדיקת זמינות וקונפליקטים בחלונות זמן).
- שליחת אימייל אישור השאלה למשתמש (דרך emailService).
- שליפת סך כל ההשאלות לפי סטטוס.
- שליפת רשימת השאלות פעילות עבור הספרנית.
- החזרת ספר (עדכון סטטוס השאלה).
=========================================================
*/

const doQuery = require("../query");
const { getConnection } = require("../dbSingleton");
const { sendBookLoanEmail } = require("../../utils/emailService");

/*
---------------------------------------------------------
reserveBook

תפקיד:
מבצעת שריון ספר והשאלה חדשה, כולל:
- בדיקת זמינות הספר במלאי.
- מניעת שריונים כפולים באותו חלון זמן למשתמש.
- בדיקת חפיפת זמנים (Overlap) כדי לוודא שאין חריגה מכמות העותקים הכללית.
- פתיחת Transaction לשמירת עקביות הנתונים.
---------------------------------------------------------
*/
async function reserveBook(userId, bookId, seatReservationId) {
  let connection;

  try {
    const databasePool = await getConnection();
    connection = await databasePool.getConnection();

    await connection.beginTransaction();

    /*
    -------------------------------------------------------
    1. שליפת פרטי הספר ונעילת השורה (FOR UPDATE)
    -------------------------------------------------------
    */
    const [books] = await connection.query(
      `
        SELECT
          bookId,
          title,
          total_quantity,
          available_quantity
        FROM book
        WHERE bookId = ?
        LIMIT 1
        FOR UPDATE
      `,
      [bookId],
    );

    if (books.length === 0) {
      await connection.rollback();
      return {
        success: false,
        statusCode: 404,
        message: "Book not found.",
      };
    }

    const book = books[0];
    const totalQuantity = Number(book.total_quantity) || 0;

    /*
    -------------------------------------------------------
    2. שליפת פרטי שריון המושב (Seat Reservation)
    -------------------------------------------------------
    */
    const [seats] = await connection.query(
      `
        SELECT
          reservationId,
          startTime,
          endTime,
          reservationDate
        FROM seat_reservation
        WHERE reservationId = ?
        LIMIT 1
      `,
      [seatReservationId],
    );

    if (seats.length === 0) {
      await connection.rollback();
      return {
        success: false,
        statusCode: 404,
        message: "Seat reservation not found.",
      };
    }

    const seat = seats[0];
    const { startTime, endTime, reservationDate } = seat;

    /*
    -------------------------------------------------------
    3. בדיקה האם המשתמש כבר הזמין את אותו הספר באותו יום
    -------------------------------------------------------
    */
    const [existingUserLoans] = await connection.query(
      `
        SELECT l.loanId
        FROM loan l
        JOIN seat_reservation sr ON l.seatReservationId = sr.reservationId
        WHERE l.userId = ?
          AND l.bookId = ?
          AND l.status = 'active'
          AND sr.reservationDate = ?
      `,
      [userId, bookId, reservationDate],
    );

    if (existingUserLoans.length > 0) {
      await connection.rollback();
      return {
        success: false,
        statusCode: 409,
        message: "You have already reserved this book for this date.",
      };
    }

    /*
    -------------------------------------------------------
    4. חישוב דינמי של עותקים תפוסים בחלון הזמן המבוקש
    -------------------------------------------------------
    */
    const [overlappingLoans] = await connection.query(
      `
        SELECT COUNT(*) AS activeCount
        FROM loan l
        JOIN seat_reservation sr ON l.seatReservationId = sr.reservationId
        WHERE l.bookId = ?
          AND l.status = 'active'
          AND sr.reservationDate = ?
          AND (
                (sr.startTime < ? AND sr.endTime > ?)
              )
      `,
      [bookId, reservationDate, endTime, startTime],
    );

    const activeCount = Number(overlappingLoans[0]?.activeCount) || 0;

    if (activeCount >= totalQuantity) {
      await connection.rollback();
      return {
        success: false,
        statusCode: 409,
        message: "No copies available for this time slot.",
      };
    }

    /*
    -------------------------------------------------------
    5. יצירת רשומת ההשאלה (Loan)
    -------------------------------------------------------
    */
    const [loanResult] = await connection.query(
      `
        INSERT INTO loan (
          userId,
          bookId,
          seatReservationId,
          loanDate,
          dueDate,
          status
        )
        VALUES (?, ?, ?, NOW(),?, 'active')
      `,
      [userId, bookId, seatReservationId, dueDateTime],
    );

    const loanId = loanResult.insertId;

    /*
    -------------------------------------------------------
    6. שליפת פרטי המשתמש לשליחת אימייל
    -------------------------------------------------------
    */
    const [users] = await connection.query(
      `
        SELECT fullName, email
        FROM user
        WHERE userId = ?
        LIMIT 1
      `,
      [userId],
    );

    await connection.commit();

    /*
    שליחת אימייל ברקע (לא חוסמת את הטרנזקציה)
    */
    if (users.length > 0) {
      const user = users[0];
      sendBookLoanEmail(
        user.email,
        user.fullName,
        book.title,
        startTime,
        endTime,
        reservationDate,
      );
    }

    return {
      success: true,
      statusCode: 201,
      message: "Book reserved successfully.",
      data: {
        loanId,
        bookId,
        seatReservationId,
      },
    };
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Failed to rollback book reservation:", rollbackError);
      }
    }

    console.error("Error reserving book:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Failed to process book reservation.",
    };
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/*
---------------------------------------------------------
getLoansCountByStatus

תפקיד:
מחזירה את סך כל ההשאלות במערכת לפי סטטוס מבוקש.
---------------------------------------------------------
*/
async function getLoansCountByStatus(status) {
  const sql = `
    SELECT COUNT(*) AS count
    FROM loan
    WHERE LOWER(status) = LOWER(?)
  `;
  const result = await doQuery(sql, [status]);
  return Number(result[0]?.count) || 0;
}

/*
---------------------------------------------------------
getActiveLoansListForLibrarian

תפקיד:
מחזירה רשימה של ההשאלות הפעילות להיום עבור הספרנית.
---------------------------------------------------------
*/
async function getAllActiveLoansListForLibrarian() {
  const sql = `
    SELECT 
      l.loanId,
      l.bookId,
      b.title AS bookTitle,
      b.total_quantity,
      DATE_FORMAT(l.loanDate, '%Y-%m-%d') AS loanDate,
      TIME_FORMAT(sr.startTime, '%H:%i') AS startTime,
      TIME_FORMAT(sr.endTime, '%H:%i') AS endTime,
      u.fullName AS userName,
      l.seatReservationId AS seatId,
      l.status
    FROM loan l
    JOIN book b ON l.bookId = b.bookId
    LEFT JOIN seat_reservation sr ON l.seatReservationId = sr.reservationId
    LEFT JOIN user u ON l.userId = u.userId
    ORDER BY l.loanDate DESC, sr.startTime ASC
    LIMIT 100
  `;
  return await doQuery(sql);
}

/*
---------------------------------------------------------
returnBookByLibrarian

תפקיד:
סימון ספר כמוחזר על ידי הספרנית.
---------------------------------------------------------
*/
async function returnBookByLibrarian(loanId) {
  let connection;

  try {
    const databasePool = await getConnection();
    connection = await databasePool.getConnection();

    await connection.beginTransaction();

    const [loans] = await connection.query(
      `
        SELECT loanId, status, bookId
        FROM loan
        WHERE loanId = ?
        LIMIT 1
        FOR UPDATE
      `,
      [loanId],
    );

    if (loans.length === 0) {
      await connection.rollback();
      return {
        success: false,
        statusCode: 404,
        message: "Loan record not found.",
      };
    }

    const loan = loans[0];

    if (loan.status === "returned") {
      await connection.rollback();
      return {
        success: false,
        statusCode: 400,
        message: "This book has already been marked as returned.",
      };
    }

    // מעדכן את סטטוס ההשאלה ל-returned ורושם את זמן ההחזרה המדויק בפועל
    await connection.query(
      `
        UPDATE loan
        SET status = 'returned',
            returnDate = NOW()
        WHERE loanId = ?
      `,
      [loanId],
    );

    await connection.commit();

    return {
      success: true,
      statusCode: 200,
      message: "Book returned successfully.",
      data: {
        loanId,
        bookId: loan.bookId,
      },
    };
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Failed to rollback return book:", rollbackError);
      }
    }

    console.error("Error returning book:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Failed to process book return.",
    };
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/*
---------------------------------------------------------
getAllActiveLoansListForLibrarian

תפקיד:
מחזירה רשימה של *כל* ההשאלות הפעילות במערכת (לא רק להיום),
מסודרות לפי תאריך ההשאלה ושעת חלון הזמן.
---------------------------------------------------------
*/
async function getAllActiveLoansListForLibrarian() {
  const sql = `
    SELECT 
      l.loanId,
      l.bookId,
      b.title AS bookTitle,
      b.total_quantity,
      DATE_FORMAT(l.loanDate, '%Y-%m-%d %H:%i') AS loanDate,
      DATE_FORMAT(l.dueDate, '%Y-%m-%d %H:%i') AS dueDate,
      DATE_FORMAT(l.returnDate, '%Y-%m-%d %H:%i') AS returnDate,
      TIME_FORMAT(sr.startTime, '%H:%i') AS startTime,
      TIME_FORMAT(sr.endTime, '%H:%i') AS endTime,
      u.fullName AS userName,
      sr.seatId AS seatId,
      l.status
    FROM loan l
    JOIN book b ON l.bookId = b.bookId
    LEFT JOIN seat_reservation sr ON l.seatReservationId = sr.reservationId
    LEFT JOIN user u ON l.userId = u.userId
    ORDER BY l.loanDate DESC, sr.startTime ASC
    LIMIT 100
  `;
  return await doQuery(sql);
}

/*
---------------------------------------------------------
ייצוא הפונקציות
---------------------------------------------------------
*/
module.exports = {
  reserveBook,
  getLoansCountByStatus,
  returnBookByLibrarian,
  getAllActiveLoansListForLibrarian,
};
