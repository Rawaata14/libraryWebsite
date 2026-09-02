/*
=========================================================
book.js

תיאור הקובץ:
Routes עבור מערכת הספרים.

הקובץ אחראי על:
- הוספת ספר על ידי ספרנית.
- העלאת תמונת כריכה.
- שליפת כל הספרים.
- שליפת ספר לפי מזהה.
- שריון ספר במסגרת הזמנת כיסא תקפה.
- חיבור שריון הספר לרשימת ההמתנה.
- עריכת פרטי ספר וכמות עותקים.
- הצעת ספר שהתפנה למשתמש הבא בתור.
- מחיקת ספר ללא היסטוריית השאלות.
=========================================================
*/

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs/promises");

const bookQueries = require("../database/queries/bookQueries");

const waitingListService = require("../services/waitingListService");

const router = express.Router();

/*
---------------------------------------------------------
storage

תפקיד:
מגדירה היכן וכיצד נשמרות תמונות הספרים.

שימוש בנתיב מוחלט מונע תלות בתיקייה שממנה
הופעל השרת.
---------------------------------------------------------
*/
const storage = multer.diskStorage({
  destination(req, file, callback) {
    const uploadsDirectory = path.join(__dirname, "..", "uploads");

    callback(null, uploadsDirectory);
  },

  filename(req, file, callback) {
    /*
    החלפת תווי נתיב מונעת שימוש בשם קובץ
    שמכיל נתיב מלא במקום שם בלבד.
    */
    const safeOriginalName = file.originalname.replace(/[/\\]/g, "_");

    callback(null, `${Date.now()}-${safeOriginalName}`);
  },
});

const upload = multer({
  storage,

  /*
  הגבלת גודל התמונה ל-5MB.
  */
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

/*
---------------------------------------------------------
removeUploadedFile

תפקיד:
מוחקת תמונה שהועלתה אך אינה נדרשת.

הפונקציה משמשת כאשר:
- הוספת הספר נכשלה.
- כבר קיים ספר עם אותו ISBN.
---------------------------------------------------------
*/
async function removeUploadedFile(file) {
  if (!file?.path) {
    return;
  }

  try {
    await fs.unlink(file.path);
  } catch (error) {
    console.error("Failed to remove unused uploaded book image:", error);
  }
}

/*
---------------------------------------------------------
removeStoredBookImage

תפקיד:
מוחקת מתיקיית uploads את תמונת הספר לאחר
שהספר נמחק בהצלחה ממסד הנתונים.

path.basename מונע שימוש בנתיב שאינו שייך
לתיקיית ההעלאות.
---------------------------------------------------------
*/
async function removeStoredBookImage(imageName) {
  if (!imageName) {
    return;
  }

  /*
  תמונה שנשמרה ככתובת חיצונית אינה קובץ מקומי,
  ולכן אין לנסות למחוק אותה מהשרת.
  */
  if (imageName.startsWith("http://") || imageName.startsWith("https://")) {
    return;
  }

  const safeImageName = path.basename(imageName);

  const imagePath = path.join(__dirname, "..", "uploads", safeImageName);

  try {
    await fs.unlink(imagePath);
  } catch (error) {
    /*
    אם הקובץ כבר אינו קיים, מחיקת הספר עדיין
    נחשבת מוצלחת.
    */
    if (error.code !== "ENOENT") {
      console.error("Failed to remove deleted book image:", error);
    }
  }
}

/*
---------------------------------------------------------
offerBookToNextWaitingUser

תפקיד:
בודקת אם יש משתמש שממתין לספר שהתפנה
ומפעילה את תהליך ההצעה למשתמש הבא בתור.

הפונקציה אינה מבטלת פעולה שכבר הצליחה אם
שליחת ההצעה או ההתראה נכשלת.

למה:
הוספת ספר או עדכון מלאי צריכים להישאר
מוצלחים גם אם שירות רשימת ההמתנה נתקל
בשגיאה זמנית.
---------------------------------------------------------
*/
async function offerBookToNextWaitingUser(bookId) {
  if (!Number.isInteger(bookId) || bookId <= 0) {
    return;
  }

  try {
    await waitingListService.offerNextBook(bookId);
  } catch (waitingListError) {
    console.error(
      "Book inventory was updated, but waiting-list processing failed:",
      waitingListError,
    );
  }
}

/*
---------------------------------------------------------
POST /books/add-book

תפקיד:
מוסיפה ספר חדש למערכת.

אם הספר כבר קיים לפי ISBN ונוספו לו עותקים,
נבדקת רשימת ההמתנה ומופעל המשתמש הבא בתור.

גישה:
רק משתמשת בעלת תפקיד librarian רשאית
להוסיף ספר.
---------------------------------------------------------
*/
router.post("/add-book", upload.single("image"), async (req, res) => {
  try {
    if (!req.session?.user) {
      await removeUploadedFile(req.file);

      return res.status(401).json({
        success: false,
        message: "User is not authenticated.",
      });
    }

    if (req.session.user.role !== "librarian") {
      await removeUploadedFile(req.file);

      return res.status(403).json({
        success: false,
        message: "Librarian privileges are required.",
      });
    }

    const bookDetails = {
      ...req.body,
      image: req.file?.filename || null,
    };

    const result = await bookQueries.addBook(bookDetails);

    /*
      אם הספר כבר קיים, עודכנה רק הכמות.
      במקרה כזה התמונה החדשה אינה נדרשת.

      גם כאשר ההוספה נכשלה, אין להשאיר
      קובץ שאינו מקושר לספר במסד.
      */
    if (!result.success || result.bookAlreadyExists) {
      await removeUploadedFile(req.file);
    }

    /*
      אם נוספו עותקים לספר שכבר קיים,
      ייתכן שכעת אפשר להציע אותו למשתמש
      הראשון ברשימת ההמתנה.

      ספר חדש אינו אמור לכלול רשימת המתנה
      קודמת, ולכן הבדיקה מופעלת רק כאשר
      הספר כבר היה קיים.
      */
    if (
      result.success &&
      result.bookAlreadyExists &&
      Number.isInteger(Number(result.bookId))
    ) {
      await offerBookToNextWaitingUser(Number(result.bookId));
    }

    if (result.success) {
      return res.status(201).json(result);
    }

    return res.status(400).json(result);
  } catch (error) {
    await removeUploadedFile(req.file);

    console.error("Error adding book:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
});

/*
---------------------------------------------------------
GET /books/all-books

תפקיד:
מחזירה את כל הספרים במאגר.

הנתיב ציבורי כדי שגם אורחים יוכלו לעיין
בספרים.
---------------------------------------------------------
*/
router.get("/all-books", async (req, res) => {
  try {
    const books = await bookQueries.getAllBooks();

    return res.status(200).json(books);
  } catch (error) {
    console.error("Error fetching books:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
});

/*
---------------------------------------------------------
GET /books/:id

תפקיד:
מחזירה ספר אחד לפי bookId.
---------------------------------------------------------
*/
router.get("/:id", async (req, res) => {
  try {
    const bookId = Number(req.params.id);

    if (!Number.isInteger(bookId) || bookId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID.",
      });
    }

    const book = await bookQueries.getBookById(bookId);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found.",
      });
    }

    return res.status(200).json(book);
  } catch (error) {
    console.error("Error fetching book:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
});

/*
---------------------------------------------------------
POST /books/:id/reserve

תפקיד:
משריינת ספר עבור המשתמש המחובר במסגרת
הזמנת כיסא תקפה השייכת לו.

לפני השריון נבדק אם קיימת הצעה פעילה
לספר מתוך רשימת ההמתנה:

- אם אין הצעה פעילה, אפשר לבצע שריון רגיל.
- אם הספר מוצע למשתמש המחובר, הוא יכול לשריין.
- אם הספר מוצע למשתמש אחר, השריון נחסם.

לאחר שריון מוצלח, הצעת רשימת ההמתנה
מסומנת כ-completed.

ה-Frontend שולח:
{
  "reservationId": 12
}
---------------------------------------------------------
*/
router.post("/:id/reserve", async (req, res) => {
  try {
    if (!req.session?.user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in before reserving a book.",
      });
    }

    const bookId = Number(req.params.id);

    const seatReservationId = Number(req.body.reservationId);

    const userId = Number(req.session.user.userId);

    if (!Number.isInteger(bookId) || bookId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID.",
      });
    }

    if (!Number.isInteger(seatReservationId) || seatReservationId <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "A seat reservation must be selected " + "before reserving a book.",
      });
    }

    /*
    בדיקת הרשאה מול הצעה פעילה ברשימת ההמתנה.

    הבדיקה מונעת ממשתמש אחר לקחת ספר שכבר
    הוצע לזמן מוגבל למשתמש הראשון בתור.
    */
    const offerAccess = await waitingListService.validateBookOfferAccess(
      bookId,
      userId,
      seatReservationId,
    );

    if (!offerAccess.success) {
      return res.status(offerAccess.status || 409).json({
        success: false,

        message:
          offerAccess.message ||
          "This book is currently offered to another user.",
      });
    }

    const result = await bookQueries.reserveBook(
      bookId,
      userId,
      seatReservationId,
    );

    /*
    מסמנים הצעה כ-completed רק לאחר ששריון
    הספר הסתיים בהצלחה.

    כך ההצעה אינה הולכת לאיבוד אם שמירת
    השריון נכשלה.
    */
    if (result.success && offerAccess.waitingId) {
      try {
        await waitingListService.completeOffer("book", offerAccess.waitingId);
      } catch (waitingListError) {
        /*
        שריון הספר כבר הצליח ולכן אין להחזיר
        למשתמש הודעת כישלון.

        השגיאה נרשמת לצורך בדיקה ותחזוקה.
        */
        console.error(
          "Book was reserved, but completing the waiting-list offer failed:",
          waitingListError,
        );
      }
    }

    return res
      .status(result.statusCode || (result.success ? 201 : 400))
      .json(result);
  } catch (error) {
    console.error("Error reserving book:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
});

/*
---------------------------------------------------------
PATCH /books/:id

תפקיד:
מעדכנת פרטי ספר וכמות עותקים.

אם העדכון יצר עותקים זמינים, נבדקת רשימת
ההמתנה ומופעל המשתמש הבא בתור.

גישה:
רק ספרנית מחוברת רשאית לבצע את הפעולה.

הכמות הזמינה אינה מתקבלת ישירות מה-Frontend.
היא מחושבת בתוך bookQueries.updateBook.
---------------------------------------------------------
*/
router.patch("/:id", async (req, res) => {
  try {
    if (!req.session?.user) {
      return res.status(401).json({
        success: false,
        message: "User is not authenticated.",
      });
    }

    if (req.session.user.role !== "librarian") {
      return res.status(403).json({
        success: false,
        message: "Librarian privileges are required.",
      });
    }

    const bookId = Number(req.params.id);

    if (!Number.isInteger(bookId) || bookId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID.",
      });
    }

    const result = await bookQueries.updateBook(bookId, req.body);

    /*
    אם לאחר העדכון קיים לפחות עותק זמין,
    בודקים אם יש משתמש שממתין לספר.

    offerNextBook מבצעת בדיקה נוספת של
    המלאי ושל רשימת ההמתנה.
    */
    if (result.success && Number(result.book?.available_quantity) > 0) {
      await offerBookToNextWaitingUser(bookId);
    }

    return res
      .status(result.statusCode || (result.success ? 200 : 400))
      .json(result);
  } catch (error) {
    console.error("Error updating book:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
});

/*
---------------------------------------------------------
DELETE /books/:id

תפקיד:
מוחקת ספר שאין לו היסטוריית השאלות.

גישה:
רק משתמשת מחוברת בעלת תפקיד librarian רשאית
למחוק ספר.
---------------------------------------------------------
*/
router.delete("/:id", async (req, res) => {
  try {
    if (!req.session?.user) {
      return res.status(401).json({
        success: false,
        message: "User is not authenticated.",
      });
    }

    if (req.session.user.role !== "librarian") {
      return res.status(403).json({
        success: false,
        message: "Librarian privileges are required.",
      });
    }

    const bookId = Number(req.params.id);

    if (!Number.isInteger(bookId) || bookId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID.",
      });
    }

    const result = await bookQueries.deleteBook(bookId);

    if (!result.success) {
      return res.status(result.statusCode || 400).json(result);
    }

    /*
    תמונת הספר נמחקת רק אחרי שמחיקת הרשומה
    ממסד הנתונים הסתיימה בהצלחה.
    */
    await removeStoredBookImage(result.bookImageName);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error deleting book:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
});

module.exports = router;
