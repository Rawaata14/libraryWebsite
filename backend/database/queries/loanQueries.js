/*
=========================================================
loanQueries.js

תיאור הקובץ:
שכבת השאילתות והלוגיקה של ניהול השאלות ושריונים במערכת.

אחריות:
- יצירת שריון והשאלה לספר (כולל בדיקת זמינות וקונפליקטים בחלונות זמן).
- שליחת אימייל אישור השאלה למשתמש (דרך emailService).
- שליפת סך כל ההשאלות לפי סטטוס.
- שליפת רשימת השאלות פעילות עבור הספרנית (להיום).
- החזרת ספר (עדכון סטטוס השאלה).
=========================================================
*/

const { doQuery } = require("../query");
const { getConnection } = require("../dbSingleton");
const { sendBookLoanEmail } = require("../../utils/emailService");
const {
  isValidDate,
  isValidTime,
  normalizeDate,
  normalizeTime,
} = require("../../utils/formatters");
const { offerNextBook } = require("../../services/waitingListService");

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
          total_quantity
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
      TIME_FORMAT(startTime, '%H:%i:%s') AS startTime,
      TIME_FORMAT(endTime, '%H:%i:%s') AS endTime,
      DATE_FORMAT(reservationDate, '%Y-%m-%d') AS reservationDate
    FROM seat_reservation
    WHERE reservationId = ?
      AND userId = ?
      AND status IN ('pending', 'active', 'occupied', 'confirmed')
      AND TIMESTAMP(reservationDate, endTime) > NOW()
    LIMIT 1
    FOR UPDATE
  `,
      [seatReservationId, userId],
    );

    if (seats.length === 0) {
      await connection.rollback();
      return {
        success: false,
        statusCode: 404,
        message: "Seat reservation not found or no longer valid.",
      };
    }

    const seat = seats[0];
    const { startTime, endTime, reservationDate } = seat;

    // נרמול הכרחי הממיר את אובייקט ה-Date למחרוזת תקנית (YYYY-MM-DD)
    const cleanDate = normalizeDate(reservationDate);
    const cleanTime = normalizeTime(endTime);
    const cleanStartTime = normalizeTime(startTime);

    // בניית תאריך ושעת היעד (dueDate) בהתאם לתאריך ההזמנה ושעת הסיום של הכיסא
    const dueDateTime = `${cleanDate} ${cleanTime}`;

    /*
-------------------------------------------------------
3. מניעת שריון כפול של אותו ספר בחלון זמן חופף

הבדיקה מתבצעת לפי מזהה המשתמש, מזהה הספר,
תאריך ההזמנה ושעות ההתחלה והסיום.

- חוסמת שריון נוסף בחלון זמן חופף,
  גם כאשר נבחר כיסא אחר בהזמנה קבוצתית.
- מאפשרת שריון נוסף בחלון זמן שאינו חופף
  באותו יום או בתאריך אחר.
- מתחשבת בהשאלות פעילות ובהשאלות באיחור.
-------------------------------------------------------
*/
    const [existingUserLoans] = await connection.query(
      `
    SELECT l.loanId
    FROM loan l
    JOIN seat_reservation sr
      ON l.seatReservationId = sr.reservationId
    WHERE l.userId = ?
      AND l.bookId = ?
      AND l.status IN ('active', 'overdue')
      AND sr.reservationDate = ?
      AND sr.startTime < ?
      AND sr.endTime > ?
  `,
      [userId, bookId, cleanDate, cleanTime, cleanStartTime],
    );

    if (existingUserLoans.length > 0) {
      await connection.rollback();
      return {
        success: false,
        statusCode: 409,
        message:
          "You have already reserved this book for an overlapping time slot.",
      };
    }

    /*
-------------------------------------------------------
4. חישוב דינמי של עותקים שאינם זמינים

החישוב כולל:
- השאלות פעילות שחופפות לחלון הזמן המבוקש.
- השאלות בסטטוס overdue שטרם הוחזרו.
- השאלות פעילות שמועד החזרתן כבר חלף,
  גם אם הסטטוס שלהן טרם עודכן ל-overdue.

ספר שלא הוחזר ממשיך לתפוס עותק עד שהספרנית
מסמנת אותו כמוחזר, ללא תלות בתאריך המבוקש.
-------------------------------------------------------
*/
    const [overlappingLoans] = await connection.query(
      `
    SELECT COUNT(*) AS activeCount
    FROM loan l
    LEFT JOIN seat_reservation sr
      ON l.seatReservationId = sr.reservationId
    WHERE l.bookId = ?
      AND (
        l.status = 'overdue'
        OR (
          l.status = 'active'
          AND (
            l.dueDate <= NOW()
            OR (
              sr.reservationDate = ?
              AND sr.startTime < ?
              AND sr.endTime > ?
            )
          )
        )
      )
  `,
      [bookId, cleanDate, cleanTime, cleanStartTime],
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
    5. יצירת רשומת ההשאלה (Loan) כולל שעת היעד המדויקת (dueDateTime)
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
        VALUES (?, ?, ?, NOW(), ?, 'active')
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
      sendBookLoanEmail(user.email, user.fullName, {
        bookTitle: book.title,
        dueDate: dueDateTime,
      });
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
getBookAvailabilityByReservation

תפקיד:
מחשבת את כמות העותקים הזמינים של ספר בהתאם
לתאריך ולחלון הזמן של הזמנת הכיסא שנבחרה,
ומזהה הזמנות כיסאות שבהן המשתמש אינו רשאי
לשריין שוב את אותו הספר עקב חפיפת זמנים.

פרמטרים:
- userId: מזהה המשתמש.
- bookId: מזהה הספר.
- seatReservationId: מזהה הזמנת הכיסא.

הפונקציה מבצעת:
- בדיקת קיום הספר.
- בדיקת בעלות ותוקף הזמנת הכיסא.
- זיהוי הזמנות כיסאות החופפות לשריוני הספר של המשתמש.
- ספירת השאלות החופפות לחלון הזמן המבוקש.
- ספירת השאלות באיחור שטרם הוחזרו.
- חישוב כמות העותקים הזמינים.

ערך מוחזר:
אובייקט הכולל תוצאת הפעולה, כמות העותקים הכוללת,
כמות העותקים התפוסים, כמות העותקים הזמינים,
סטטוס זמינות הספר ורשימת מזהי הזמנות הכיסאות
החסומות לשריון נוסף של אותו הספר.

---------------------------------------------------------
*/
async function getBookAvailabilityByReservation(
  userId,
  bookId,
  seatReservationId,
) {
  try {
    const books = await doQuery(
      `
        SELECT bookId, total_quantity
        FROM book
        WHERE bookId = ?
        LIMIT 1
      `,
      [bookId],
    );

    if (books.length === 0) {
      return {
        success: false,
        statusCode: 404,
        message: "Book not found.",
      };
    }

    const seats = await doQuery(
      `
        SELECT
          DATE_FORMAT(reservationDate, '%Y-%m-%d')
            AS reservationDate,
          TIME_FORMAT(startTime, '%H:%i:%s')
            AS startTime,
          TIME_FORMAT(endTime, '%H:%i:%s')
            AS endTime
        FROM seat_reservation
        WHERE reservationId = ?
          AND userId = ?
          AND status IN (
            'pending', 'active', 'occupied', 'confirmed'
          )
          AND TIMESTAMP(reservationDate, endTime) > NOW()
        LIMIT 1
      `,
      [seatReservationId, userId],
    );

    if (seats.length === 0) {
      return {
        success: false,
        statusCode: 404,
        message: "Seat reservation not found or no longer valid.",
      };
    }

    const seat = seats[0];

    /*
-------------------------------------------------------
שליפת הזמנות הכיסאות החופפות לשריוני הספר של המשתמש

הבדיקה כוללת את כל הזמנות הכיסאות התקפות של המשתמש
שחלונות הזמן שלהן חופפים להשאלה קיימת של אותו ספר.

מטרת הבדיקה היא למנוע שריון כפול, גם כאשר המשתמש
בוחר כיסא אחר באותו חלון זמן בהזמנה קבוצתית.
-------------------------------------------------------
*/
    const blockedReservations = await doQuery(
      `
    SELECT DISTINCT sr.reservationId
    FROM seat_reservation sr
    JOIN loan l
      ON l.userId = sr.userId
    JOIN seat_reservation loanSeat
      ON l.seatReservationId = loanSeat.reservationId
    WHERE sr.userId = ?
      AND l.bookId = ?
      AND l.status IN ('active', 'overdue')
      AND sr.status IN (
        'pending', 'active', 'occupied', 'confirmed'
      )
      AND TIMESTAMP(sr.reservationDate, sr.endTime) > NOW()
      AND sr.reservationDate = loanSeat.reservationDate
      AND sr.startTime < loanSeat.endTime
      AND sr.endTime > loanSeat.startTime
  `,
      [userId, bookId],
    );

    const blockedReservationIds = blockedReservations.map((reservation) =>
      Number(reservation.reservationId),
    );

    const overlappingLoans = await doQuery(
      `
        SELECT COUNT(*) AS activeCount
        FROM loan l
        LEFT JOIN seat_reservation sr
          ON l.seatReservationId = sr.reservationId
        WHERE l.bookId = ?
          AND (
            l.status = 'overdue'
            OR (
              l.status = 'active'
              AND (
                l.dueDate <= NOW()
                OR (
                  sr.reservationDate = ?
                  AND sr.startTime < ?
                  AND sr.endTime > ?
                )
              )
            )
          )
      `,
      [bookId, seat.reservationDate, seat.endTime, seat.startTime],
    );

    const totalQuantity = Number(books[0].total_quantity) || 0;

    const activeCount = Number(overlappingLoans[0]?.activeCount) || 0;

    const availableQuantity = Math.max(0, totalQuantity - activeCount);

    return {
      success: true,
      statusCode: 200,
      data: {
        bookId,
        seatReservationId,
        total_quantity: totalQuantity,
        occupied_quantity: activeCount,
        available_quantity: availableQuantity,
        isAvailable: availableQuantity > 0,
        blockedReservationIds,
      },
    };
  } catch (error) {
    console.error("Error checking book availability:", error);

    return {
      success: false,
      statusCode: 500,
      message: "Failed to check book availability.",
    };
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
returnBookByLibrarian

תפקיד:
סימון ספר כמוחזר על ידי הספרנית ורישום זמן החזרה מדויק.
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

    try {
      await offerNextBook(loan.bookId);
    } catch (waitingListError) {
      console.error(
        "Error offering next book from waiting list:",
        waitingListError,
      );
    }

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
getTodaysLoansListForLibrarian

תפקיד:
מחזירה רשימה של ההשאלות **להיום בלבד** (מיועד לדשבורד הראשי).
---------------------------------------------------------
*/
async function getTodaysLoansListForLibrarian() {
  const sql = `
    SELECT 
      l.loanId,
      l.bookId,
      b.title AS bookTitle,
      b.total_quantity,
      -- חישוב דינמי של העותקים הפנויים באותו חלון זמן עבור אותו ספר
      (b.total_quantity - (
        SELECT COUNT(*) 
        FROM loan l2 
        JOIN seat_reservation sr2 ON l2.seatReservationId = sr2.reservationId
        WHERE l2.bookId = l.bookId 
          AND l2.status = 'active'
          AND sr2.reservationDate = sr.reservationDate
          AND sr2.startTime = sr.startTime 
          AND sr2.endTime = sr.endTime
      )) AS remainingCopies,
      DATE_FORMAT(l.loanDate, '%Y-%m-%d %H:%i') AS loanDate,
      DATE_FORMAT(l.dueDate, '%Y-%m-%d %H:%i') AS dueDate,
      DATE_FORMAT(l.returnDate, '%Y-%m-%d %H:%i') AS returnDate,
      TIME_FORMAT(sr.startTime, '%H:%i') AS startTime,
      TIME_FORMAT(sr.endTime, '%H:%i') AS endTime,
      u.fullName AS userName,
      sr.seatId AS seatNumber,
      l.status
    FROM loan l
    JOIN book b ON l.bookId = b.bookId
    LEFT JOIN seat_reservation sr ON l.seatReservationId = sr.reservationId
    LEFT JOIN user u ON l.userId = u.userId
    WHERE sr.reservationDate = CURDATE()
      AND l.status = 'active'
    ORDER BY sr.startTime DESC, l.loanDate ASC
  `;
  return await doQuery(sql);
}

/*
---------------------------------------------------------
getAllLoansListForLibrarian

תפקיד:
מחזירה את כל ההשאלות במערכת (מיועד לדף ניהול ההשאלות וההיסטוריה),
עם אופציה לסינון מתקדם לפי תאריך ו/או שעה ספציפית.
---------------------------------------------------------
*/
async function getAllLoansListForLibrarian(
  selectedDate = null,
  selectedTime = null,
) {
  let sql = `
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
      sr.seatId AS seatNumber,
      l.status
    FROM loan l
    JOIN book b ON l.bookId = b.bookId
    LEFT JOIN seat_reservation sr ON l.seatReservationId = sr.reservationId
    LEFT JOIN user u ON l.userId = u.userId
    WHERE 1=1
  `;

  const queryParams = [];

  // סינון לפי תאריך אם נבחר
  if (selectedDate) {
    sql += ` AND sr.reservationDate = ? `;
    queryParams.push(selectedDate);
  }

  // סינון לפי שעה אם נבחרה (בודק האם השעה המבוקשת נופלת בתוך חלון הזמן של ההשאלה)
  if (selectedTime) {
    sql += ` AND ? BETWEEN sr.startTime AND sr.endTime `;
    queryParams.push(selectedTime);
  }

  sql += ` ORDER BY l.loanDate DESC, l.loanId DESC, sr.startTime ASC LIMIT 100 `;

  return await doQuery(sql, queryParams);
}

/*
---------------------------------------------------------
ייצוא הפונקציות
---------------------------------------------------------
*/
module.exports = {
  reserveBook,
  getBookAvailabilityByReservation,
  getLoansCountByStatus,
  returnBookByLibrarian,
  getTodaysLoansListForLibrarian,
  getAllLoansListForLibrarian,
};
