/*
=========================================================
bookQueries.js

תיאור הקובץ:
שכבת השאילתות של מערכת הספרים.

אחריות:
- הוספת ספר חדש.
- עדכון מלאי כאשר ISBN כבר קיים.
- שליפת ספרים.
- עריכת פרטי ספר וכמות עותקים.
- שריון ספר במסגרת הזמנת כיסא תקפה.
- מחיקת ספר שאין לו היסטוריית השאלות.
=========================================================
*/

const doQuery = require("../query");
const { getConnection } = require("../dbSingleton");

/*
---------------------------------------------------------
addBook

תפקיד:
מוסיפה ספר חדש למסד הנתונים.

אם כבר קיים ספר עם אותו ISBN:
- לא נוצר ספר כפול.
- הכמות הכללית מתעדכנת.
- הכמות הזמינה מתעדכנת.
---------------------------------------------------------
*/
async function addBook(bookDetails) {
  const {
    isbn,
    title,
    author,
    publishYear,
    status,
    quantity,
    category,
    image,
  } = bookDetails;

  if (!isbn || !title || !author || !quantity) {
    return {
      success: false,
      message: "Missing required fields",
    };
  }

  const normalizedStatus = status || "available";
  const normalizedCategory = category || "General";
  const quantityInt = Number.parseInt(quantity, 10);

  if (!Number.isInteger(quantityInt) || quantityInt < 1) {
    return {
      success: false,
      message: "Quantity must be at least 1",
    };
  }

  try {
    const checkBookSQL = `
      SELECT *
      FROM book
      WHERE isbn = ?
      LIMIT 1
    `;

    const existingBooks = await doQuery(checkBookSQL, [isbn]);

    /*
    -------------------------------------------------------
    עדכון מלאי של ספר קיים
    -------------------------------------------------------
    */
    if (existingBooks.length > 0) {
      const existingBook = existingBooks[0];

      const currentTotalQuantity = Number(existingBook.total_quantity) || 0;

      const currentAvailableQuantity =
        Number(existingBook.available_quantity) || 0;

      const newTotalQuantity = currentTotalQuantity + quantityInt;

      const newAvailableQuantity = currentAvailableQuantity + quantityInt;

      const updateBookSQL = `
        UPDATE book
        SET total_quantity = ?,
            available_quantity = ?
        WHERE isbn = ?
      `;

      await doQuery(updateBookSQL, [
        newTotalQuantity,
        newAvailableQuantity,
        isbn,
      ]);

      return {
        success: true,
        bookAlreadyExists: true,
        message: `Book already exists. Quantity updated to ${newTotalQuantity}`,
      };
    }

    /*
    -------------------------------------------------------
    הוספת ספר חדש
    -------------------------------------------------------
    */
    const insertBookSQL = `
      INSERT INTO book (
        isbn,
        title,
        author,
        publishYear,
        status,
        total_quantity,
        available_quantity,
        category,
        book_image_name
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await doQuery(insertBookSQL, [
      isbn,
      title,
      author,
      publishYear || null,
      normalizedStatus,
      quantityInt,
      quantityInt,
      normalizedCategory,
      image || null,
    ]);

    if (result.affectedRows > 0) {
      return {
        success: true,
        bookAlreadyExists: false,
        message: "Book added successfully",
      };
    }

    return {
      success: false,
      message: "Failed to add book",
    };
  } catch (error) {
    console.error("Error adding book:", error);

    return {
      success: false,
      message: "An error occurred while adding the book",
    };
  }
}

/*
---------------------------------------------------------
getAllBooks

תפקיד:
מחזירה את כל הספרים במאגר.
---------------------------------------------------------
*/
async function getAllBooks() {
  try {
    const sql = `
      SELECT *
      FROM book
      ORDER BY title ASC
    `;

    return await doQuery(sql);
  } catch (error) {
    console.error("Error fetching books:", error);

    throw new Error("An error occurred while fetching books");
  }
}

/*
---------------------------------------------------------
getBookById

תפקיד:
מחזירה ספר אחד לפי bookId.
---------------------------------------------------------
*/
async function getBookById(bookId) {
  try {
    const sql = `
      SELECT *
      FROM book
      WHERE bookId = ?
      LIMIT 1
    `;

    const books = await doQuery(sql, [bookId]);

    if (books.length === 0) {
      return null;
    }

    return books[0];
  } catch (error) {
    console.error("Error fetching book by ID:", error);

    throw new Error("An error occurred while fetching the book");
  }
}

/*
---------------------------------------------------------
updateBook

תפקיד:
מעדכנת את פרטי הספר ואת הכמות הכוללת בצורה בטוחה.

הכמות הזמינה אינה מתקבלת מה-Frontend. במקום זאת
נשמר מספר העותקים שאינם זמינים כרגע:

total_quantity - available_quantity

כך לא ניתן להחזיר בטעות עותק מושאל למלאי.
---------------------------------------------------------
*/
async function updateBook(bookId, bookDetails) {
  const title = bookDetails.title?.trim();
  const author = bookDetails.author?.trim();
  const isbn = bookDetails.isbn?.trim();

  const category = bookDetails.category?.trim() || "General";

  const totalQuantity = Number.parseInt(bookDetails.totalQuantity, 10);

  const publishYear =
    bookDetails.publishYear === "" || bookDetails.publishYear == null
      ? null
      : Number.parseInt(bookDetails.publishYear, 10);

  const currentYear = new Date().getFullYear();

  /*
  -------------------------------------------------------
  בדיקת שדות חובה
  -------------------------------------------------------
  */
  if (!title || !author || !isbn) {
    return {
      success: false,
      statusCode: 400,
      message: "ISBN, title and author are required.",
    };
  }

  /*
  -------------------------------------------------------
  בדיקת הכמות הכוללת
  -------------------------------------------------------
  */
  if (!Number.isInteger(totalQuantity) || totalQuantity < 1) {
    return {
      success: false,
      statusCode: 400,
      message: "Total quantity must be at least 1.",
    };
  }

  /*
  -------------------------------------------------------
  בדיקת שנת הפרסום
  -------------------------------------------------------
  */
  if (
    publishYear !== null &&
    (!Number.isInteger(publishYear) ||
      publishYear < 1000 ||
      publishYear > currentYear)
  ) {
    return {
      success: false,
      statusCode: 400,
      message: `Publish year must be between 1000 and ${currentYear}.`,
    };
  }

  let connection;

  try {
    const databasePool = await getConnection();

    connection = await databasePool.getConnection();

    await connection.beginTransaction();

    /*
    -------------------------------------------------------
    נעילת רשומת הספר בזמן העדכון

    הנעילה מונעת שינוי מקביל של המלאי בזמן
    שהספרנית מעדכנת את כמות העותקים.
    -------------------------------------------------------
    */
    const [books] = await connection.query(
      `
        SELECT
          bookId,
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

    const currentBook = books[0];

    /*
    -------------------------------------------------------
    חישוב מספר העותקים שאינם זמינים

    לדוגמה:
    total_quantity = 5
    available_quantity = 3
    unavailableCopies = 2
    -------------------------------------------------------
    */
    const unavailableCopies = Math.max(
      0,
      Number(currentBook.total_quantity) -
        Number(currentBook.available_quantity),
    );

    /*
    -------------------------------------------------------
    מניעת הסרת עותק שכבר מושאל או משוריין
    -------------------------------------------------------
    */
    if (totalQuantity < unavailableCopies) {
      await connection.rollback();

      return {
        success: false,
        statusCode: 409,
        message:
          `Quantity cannot be lower than ${unavailableCopies}, ` +
          `because ${unavailableCopies} copies are currently unavailable.`,
      };
    }

    /*
    -------------------------------------------------------
    בדיקת ISBN כפול

    מותר לספר לשמור את ה-ISBN הנוכחי שלו,
    אך אסור להשתמש ב-ISBN של ספר אחר.
    -------------------------------------------------------
    */
    const [duplicateBooks] = await connection.query(
      `
        SELECT bookId
        FROM book
        WHERE isbn = ?
          AND bookId <> ?
        LIMIT 1
      `,
      [isbn, bookId],
    );

    if (duplicateBooks.length > 0) {
      await connection.rollback();

      return {
        success: false,
        statusCode: 409,
        message: "Another book already uses this ISBN.",
      };
    }

    /*
    -------------------------------------------------------
    חישוב הכמות הזמינה והסטטוס החדש
    -------------------------------------------------------
    */
    const availableQuantity = totalQuantity - unavailableCopies;

    const status = availableQuantity > 0 ? "available" : "unavailable";

    /*
    -------------------------------------------------------
    עדכון פרטי הספר והמלאי
    -------------------------------------------------------
    */
    await connection.query(
      `
        UPDATE book
        SET isbn = ?,
            title = ?,
            author = ?,
            publishYear = ?,
            category = ?,
            status = ?,
            total_quantity = ?,
            available_quantity = ?
        WHERE bookId = ?
      `,
      [
        isbn,
        title,
        author,
        publishYear,
        category,
        status,
        totalQuantity,
        availableQuantity,
        bookId,
      ],
    );

    /*
    -------------------------------------------------------
    שליפת הספר לאחר העדכון

    הספר המעודכן נשלח ל-Frontend כדי לעדכן
    מיד את הכרטיס ללא רענון הדף.
    -------------------------------------------------------
    */
    const [updatedBooks] = await connection.query(
      `
        SELECT *
        FROM book
        WHERE bookId = ?
        LIMIT 1
      `,
      [bookId],
    );

    await connection.commit();

    return {
      success: true,
      statusCode: 200,
      message: "Book updated successfully.",
      book: updatedBooks[0],
    };
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Failed to rollback book update:", rollbackError);
      }
    }

    /*
    הגנה נוספת במקרה שקיים UNIQUE על ISBN.
    */
    if (error.code === "ER_DUP_ENTRY") {
      return {
        success: false,
        statusCode: 409,
        message: "Another book already uses this ISBN.",
      };
    }

    console.error("Error updating book:", error);

    return {
      success: false,
      statusCode: 500,
      message: "Failed to update book.",
    };
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/*
---------------------------------------------------------
reserveBook

תפקיד:
משריינת ספר עבור המשתמש במסגרת הזמנת כיסא תקפה.

הפעולה מתבצעת בתוך Transaction כדי להבטיח:
- שהזמנת הכיסא שייכת למשתמש.
- שההזמנה לא בוטלה ולא הסתיימה.
- שקיים עותק זמין מהספר.
- שהספר לא שוריין פעמיים לאותה הזמנה.
- שהפחתת המלאי ויצירת ההשאלה מצליחות יחד.
---------------------------------------------------------
*/
async function reserveBook(bookId, userId, seatReservationId) {
  let connection;

  try {
    const databasePool = await getConnection();

    connection = await databasePool.getConnection();

    await connection.beginTransaction();

    /*
    -------------------------------------------------------
    בדיקת הזמנת הכיסא

    ההזמנה חייבת:
    - להיות שייכת למשתמש המחובר.
    - להיות פעילה או מאושרת.
    - להסתיים בעתיד.
    -------------------------------------------------------
    */
    const [reservations] = await connection.query(
      `
        SELECT
          reservationId,
          seatId,
          DATE_FORMAT(
            reservationDate,
            '%Y-%m-%d'
          ) AS reservationDate,
          startTime,
          endTime,
          status
        FROM seat_reservation
        WHERE reservationId = ?
          AND userId = ?
          AND LOWER(status) IN (
            'pending',
            'active',
            'occupied',
            'confirmed'
          )
          AND TIMESTAMP(
            reservationDate,
            endTime
          ) > NOW()
        LIMIT 1
        FOR UPDATE
      `,
      [seatReservationId, userId],
    );

    if (reservations.length === 0) {
      await connection.rollback();

      return {
        success: false,
        statusCode: 404,
        message:
          "A valid upcoming seat reservation is required " +
          "before reserving a book.",
      };
    }

    const seatReservation = reservations[0];

    /*
    -------------------------------------------------------
    בדיקת הספר והמלאי

    FOR UPDATE נועל זמנית את שורת הספר.
    כך שני משתמשים אינם יכולים לקבל יחד
    את העותק האחרון.
    -------------------------------------------------------
    */
    const [books] = await connection.query(
      `
        SELECT
          bookId,
          title,
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

    if (Number(book.available_quantity) <= 0) {
      await connection.rollback();

      return {
        success: false,
        statusCode: 409,
        message: "No available copies for this book.",
      };
    }

    /*
    -------------------------------------------------------
    מניעת שריון כפול

    המשתמש אינו יכול לשריין את אותו ספר פעמיים
    במסגרת אותה הזמנת כיסא.
    -------------------------------------------------------
    */
    const [existingLoans] = await connection.query(
      `
        SELECT loanId
        FROM loan
        WHERE seatReservationId = ?
          AND bookId = ?
        LIMIT 1
      `,
      [seatReservationId, bookId],
    );

    if (existingLoans.length > 0) {
      await connection.rollback();

      return {
        success: false,
        statusCode: 409,
        message:
          "This book is already reserved for the " +
          "selected seat reservation.",
      };
    }

    /*
    -------------------------------------------------------
    עדכון מלאי הספר
    -------------------------------------------------------
    */
    const [inventoryResult] = await connection.query(
      `
          UPDATE book
          SET available_quantity =
            available_quantity - 1
          WHERE bookId = ?
            AND available_quantity > 0
        `,
      [bookId],
    );

    if (inventoryResult.affectedRows === 0) {
      await connection.rollback();

      return {
        success: false,
        statusCode: 409,
        message: "No available copies for this book.",
      };
    }

    /*
    -------------------------------------------------------
    יצירת ההשאלה

    loanDate ו-dueDate הם תאריך הזמנת הכיסא.
    שעת קבלת הספר ושעת החזרתו מתקבלות דרך
    הזמנת הכיסא.
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
        VALUES (?, ?, ?, ?, ?, 'active')
      `,
      [
        userId,
        bookId,
        seatReservationId,
        seatReservation.reservationDate,
        seatReservation.reservationDate,
      ],
    );

    await connection.commit();

    return {
      success: true,
      statusCode: 201,
      message: "Book reserved successfully.",

      data: {
        loanId: loanResult.insertId,
        bookId,
        bookTitle: book.title,
        seatReservationId,
        seatId: seatReservation.seatId,
        reservationDate: seatReservation.reservationDate,
        startTime: seatReservation.startTime,
        endTime: seatReservation.endTime,
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

    /*
    המפתח הייחודי במסד הוא שכבת הגנה נוספת
    מפני שתי בקשות זהות שמגיעות בו-זמנית.
    */
    if (error.code === "ER_DUP_ENTRY") {
      return {
        success: false,
        statusCode: 409,
        message:
          "This book is already reserved for the " +
          "selected seat reservation.",
      };
    }

    console.error("Error reserving book:", error);

    return {
      success: false,
      statusCode: 500,
      message: "Failed to reserve book.",
    };
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/*
---------------------------------------------------------
deleteBook

תפקיד:
מוחקת ספר מהמערכת רק אם אין עבורו היסטוריית
השאלות.

הבדיקה מתבצעת גם בקוד וגם באמצעות Foreign Key
במסד הנתונים.
---------------------------------------------------------
*/
async function deleteBook(bookId) {
  try {
    /*
    -------------------------------------------------------
    בדיקת קיום הספר
    -------------------------------------------------------
    */
    const books = await doQuery(
      `
        SELECT
          bookId,
          title,
          book_image_name
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

    const book = books[0];

    /*
    -------------------------------------------------------
    בדיקת היסטוריית השאלות

    ספר שהושאל בעבר אינו נמחק, משום שמחיקתו
    תפגע בהיסטוריית הפעילות של הספרייה.
    -------------------------------------------------------
    */
    const loanCountResult = await doQuery(
      `
        SELECT COUNT(*) AS count
        FROM loan
        WHERE bookId = ?
      `,
      [bookId],
    );

    const loanCount = Number(loanCountResult[0]?.count) || 0;

    if (loanCount > 0) {
      return {
        success: false,
        statusCode: 409,
        message:
          "This book cannot be deleted because " + "it has a loan history.",
      };
    }

    /*
    -------------------------------------------------------
    מחיקת הספר
    -------------------------------------------------------
    */
    const result = await doQuery(
      `
        DELETE FROM book
        WHERE bookId = ?
      `,
      [bookId],
    );

    if (result.affectedRows === 0) {
      return {
        success: false,
        statusCode: 404,
        message: "Book not found.",
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: "Book deleted successfully.",
      bookImageName: book.book_image_name,
    };
  } catch (error) {
    /*
    MySQL מחזיר שגיאה זו כאשר Foreign Key מונע
    מחיקת רשומה שיש לה מידע קשור.
    */
    if (
      error.code === "ER_ROW_IS_REFERENCED" ||
      error.code === "ER_ROW_IS_REFERENCED_2"
    ) {
      return {
        success: false,
        statusCode: 409,
        message:
          "This book cannot be deleted because " + "it has related records.",
      };
    }

    console.error("Error deleting book:", error);

    return {
      success: false,
      statusCode: 500,
      message: "Failed to delete book.",
    };
  }
}

/*
---------------------------------------------------------
ייצוא הפונקציות
---------------------------------------------------------
*/
module.exports = {
  addBook,
  getAllBooks,
  getBookById,
  updateBook,
  reserveBook,
  deleteBook,
};
