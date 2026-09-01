/*
=========================================================
waitingListMaintenanceService.js

תיאור הקובץ:
שירות תחזוקה מרכזי עבור רשימות ההמתנה של ספרים
ושל מקומות ישיבה.

השירות אחראי על פעולות שאינן מתבצעות ישירות
באמצעות בקשה של המשתמש, אלא כתוצאה משינוי במצב
המערכת או מבדיקה אוטומטית המתבצעת ברקע.

אחריות מרכזית:
- סימון הצעת המתנה כמומשה.
- טיפול בהצעות שפג תוקפן.
- העברת ההצעה למשתמש הבא בתור.
- החזרת ספרים למלאי לאחר סיום הזמנת מקום.
- החזרת ספרים למלאי לאחר ביטול הזמנת מקום.
- הצעת ספר שהתפנה למשתמש הבא ברשימת ההמתנה.

הפרדה מקצועית:
הקובץ אינו מכיל שאילתות SQL.
כל הפעולות מול מסד הנתונים מתבצעות דרך
waitingListQueries.

בנוסף, שליחת הצעות חדשות מתבצעת דרך השירות
המתאים לסוג ההמתנה:
- bookWaitingListService עבור ספרים.
- seatWaitingListService עבור מקומות ישיבה.
=========================================================
*/

const waitingListQueries = require("../database/queries/waitingListQueries");

const { getLibraryDateTime } = require("../utils/libraryDateTime");

const { offerNextBook } = require("./bookWaitingListService");

const { offerNextSeat } = require("./seatWaitingListService");

/*
---------------------------------------------------------
completeOffer

תפקיד:
מסמנת הצעה פעילה מרשימת ההמתנה כהצעה שמומשה.

הפונקציה נקראת לאחר שהמשתמש השלים בהצלחה את
ההזמנה של הספר או של מקום הישיבה שהוצעו לו.

פרמטרים:
- type:
  סוג רשימת ההמתנה.
  הערכים האפשריים הם:
  "book" או "seat".

- waitingId:
  המזהה של הרשומה ברשימת ההמתנה.

התנהגות:
- אם לא התקבל waitingId, אין צורך לבצע עדכון.
- זמן המימוש נשמר לפי זמן הספרייה.
- פעולת העדכון מועברת לשכבת השאילתות.

חשיבות:
יש לסמן את ההצעה כמומשה רק לאחר שההזמנה עצמה
נשמרה בהצלחה במסד הנתונים. כך לא נאבד את מקומו
של המשתמש אם שמירת ההזמנה נכשלה.
---------------------------------------------------------
*/
async function completeOffer(type, waitingId) {
  if (!waitingId) {
    return {
      success: true,
      skipped: true,
      message: "No waiting-list offer needed completion",
    };
  }

  const now = getLibraryDateTime();

  const result = await waitingListQueries.completeOffer(
    type,
    waitingId,
    now.sqlDateTime,
  );

  return {
    success: true,
    skipped: false,
    result,
  };
}

/*
---------------------------------------------------------
processExpiredBookOffers

תפקיד:
מטפלת בכל הצעות הספרים שתוקפן פג.

מהלך הפעולה עבור כל הצעה:
1. מסמנת את ההצעה שפג תוקפה כ-expired.
2. בודקת שהרשומה אכן עודכנה על ידי התהליך הנוכחי.
3. אם העדכון הצליח, מנסה להעביר את ההצעה
   למשתמש הבא בתור עבור אותו ספר.

בדיקת affectedRows:
ייתכן ששני תהליכי רקע ינסו לטפל באותה הצעה.
רק התהליך שהצליח לשנות את הרשומה בפועל רשאי
להציע את הספר למשתמש הבא.

פרמטר:
- expiredBooks:
  מערך ההצעות שפג תוקפן שהתקבל משכבת השאילתות.

ערך מוחזר:
מספר הצעות הספרים שעברו בהצלחה למצב expired.
---------------------------------------------------------
*/
async function processExpiredBookOffers(expiredBooks) {
  let expiredCount = 0;

  for (const entry of expiredBooks) {
    try {
      const result = await waitingListQueries.expireOffer(
        "book",
        entry.queueBookId,
      );

      if (result.affectedRows !== 1) {
        continue;
      }

      expiredCount += 1;

      await offerNextBook(entry.bookId);
    } catch (error) {
      /*
      כשל בטיפול בהצעה אחת אינו צריך לעצור את כל
      מחזור התחזוקה. השגיאה נרשמת והמערכת ממשיכה
      לטפל בהצעות האחרות.
      */
      console.error(
        `Failed to process expired book offer ${entry.queueBookId}:`,
        error,
      );
    }
  }

  return expiredCount;
}

/*
---------------------------------------------------------
processExpiredSeatOffers

תפקיד:
מטפלת בכל הצעות מקומות הישיבה שתוקפן פג.

מקום ישיבה אינו מזוהה רק באמצעות seatId.
כל תור משויך גם ל:
- תאריך מבוקש.
- שעת התחלה.
- שעת סיום.

לכן, לאחר פקיעת הצעה, הפונקציה מעבירה את
הפרטים המלאים אל offerNextSeat כדי שההצעה
החדשה תישלח רק למשתמש הבא שממתין לאותו מקום
ובאותו טווח זמן בדיוק.

פרמטר:
- expiredSeats:
  מערך הצעות מקומות הישיבה שפג תוקפן.

ערך מוחזר:
מספר הצעות המקומות שעברו בהצלחה למצב expired.
---------------------------------------------------------
*/
async function processExpiredSeatOffers(expiredSeats) {
  let expiredCount = 0;

  for (const entry of expiredSeats) {
    try {
      const result = await waitingListQueries.expireOffer(
        "seat",
        entry.queueSeatId,
      );

      if (result.affectedRows !== 1) {
        continue;
      }

      expiredCount += 1;

      await offerNextSeat(
        entry.seatId,
        entry.requestedDate,
        entry.requestedStartTime,
        entry.requestedEndTime,
      );
    } catch (error) {
      /*
      גם כאן, הצעה בעייתית אחת אינה עוצרת את כל
      פעולת התחזוקה של רשימות ההמתנה.
      */
      console.error(
        `Failed to process expired seat offer ${entry.queueSeatId}:`,
        error,
      );
    }
  }

  return expiredCount;
}

/*
---------------------------------------------------------
processExpiredOffers

תפקיד:
מאתרת ומטפלת בכל הצעות ההמתנה שפג תוקפן.

הפונקציה מטפלת בשני סוגי הרשימות:
- רשימת המתנה לספרים.
- רשימת המתנה למקומות ישיבה.

מהלך הפעולה:
1. מקבלת את השעה הנוכחית לפי זמן הספרייה.
2. מבקשת משכבת השאילתות את כל ההצעות שפג תוקפן.
3. מעבירה את הצעות הספרים לטיפול הייעודי.
4. מעבירה את הצעות המקומות לטיפול הייעודי.
5. מחזירה סיכום של מספר הרשומות שטופלו.

הפונקציה מיועדת להפעלה מתוך
waitingListScheduler.
---------------------------------------------------------
*/
async function processExpiredOffers() {
  const now = getLibraryDateTime();

  const expiredOffers = await waitingListQueries.getExpiredOffers(
    now.sqlDateTime,
  );

  const expiredBookOffers = Array.isArray(expiredOffers.books)
    ? expiredOffers.books
    : [];

  const expiredSeatOffers = Array.isArray(expiredOffers.seats)
    ? expiredOffers.seats
    : [];

  const expiredBooksCount = await processExpiredBookOffers(expiredBookOffers);

  const expiredSeatsCount = await processExpiredSeatOffers(expiredSeatOffers);

  return {
    success: true,
    expiredBooks: expiredBooksCount,
    expiredSeats: expiredSeatsCount,
  };
}

/*
---------------------------------------------------------
offerReleasedBooks

תפקיד:
מציעה למשתמש הבא בתור כל ספר שחזר למלאי.

פרמטר:
- bookIds:
  מערך מזהי ספרים שחזרו למלאי.

המערך עשוי לכלול כמה ספרים אם המשתמש הזמין יותר
מספר אחד במסגרת אותה הזמנת מקום.

כל ספר נשלח בנפרד אל offerNextBook, אשר בודקת:
- האם הספר אכן זמין.
- האם קיימת כבר הצעה פעילה.
- מי המשתמש הראשון שממתין.
- האם יש לשלוח התראה והודעת דוא"ל.
---------------------------------------------------------
*/
async function offerReleasedBooks(bookIds) {
  const uniqueBookIds = [
    ...new Set(
      (Array.isArray(bookIds) ? bookIds : [])
        .map((bookId) => Number(bookId))
        .filter((bookId) => Number.isInteger(bookId) && bookId > 0),
    ),
  ];

  for (const bookId of uniqueBookIds) {
    try {
      await offerNextBook(bookId);
    } catch (error) {
      /*
      כשל בהצעת ספר אחד אינו מונע הצעה של ספרים
      אחרים שחזרו למלאי באותו מחזור.
      */
      console.error(`Failed to offer released book ${bookId}:`, error);
    }
  }

  return uniqueBookIds;
}

/*
---------------------------------------------------------
releaseFinishedLoansAndOfferBooks

תפקיד:
מחזירה למלאי ספרים שהשימוש בהם הסתיים ומעבירה
אותם למשתמשים הבאים ברשימת ההמתנה.

במערכת הנוכחית הזמנת ספר מקושרת להזמנת מקום
בספרייה. לכן, כאשר מועד השימוש במקום הסתיים,
גם הספר שהוזמן במסגרת אותו ביקור צריך לחזור
למלאי.

מהלך הפעולה:
1. מקבלת את התאריך והשעה הנוכחיים לפי זמן הספרייה.
2. מבקשת משכבת השאילתות לסגור את ההשאלות
   שהזמן שלהן הסתיים.
3. הכמות הזמינה של הספרים מתעדכנת במסד הנתונים.
4. כל ספר שהתפנה מוצע למשתמש הבא בתור.

ערך מוחזר:
מערך מזהי הספרים שחזרו למלאי.
---------------------------------------------------------
*/
async function releaseFinishedLoansAndOfferBooks() {
  const now = getLibraryDateTime();

  const releasedBookIds = await waitingListQueries.releaseFinishedLoans(
    now.date,
    now.time,
  );

  return offerReleasedBooks(releasedBookIds);
}

/*
---------------------------------------------------------
releaseReservationBooksAndOffer

תפקיד:
מחזירה באופן מיידי למלאי את הספרים המשויכים
להזמנת מקום שבוטלה.

פרמטר:
- reservationId:
  מזהה הזמנת מקום הישיבה שבוטלה.

למה הפעולה מתבצעת מיד:
אם המשתמש ביטל את הזמנת המקום, הוא כבר אינו
אמור להגיע להשתמש בספרייה במסגרת אותה הזמנה.
לכן אין הצדקה להשאיר את הספר שמור עד לשעת
הסיום המקורית.

מהלך הפעולה:
1. מאתרת את הספרים הפעילים הקשורים להזמנה.
2. סוגרת את ההשאלות שלהם.
3. מחזירה את הכמות למלאי.
4. מבטלת המתנות לספר שתלויות בהזמנה שבוטלה,
   בהתאם לטיפול המוגדר בשכבת השאילתות.
5. מציעה כל ספר שהתפנה למשתמש הבא בתור.

ערך מוחזר:
מערך מזהי הספרים שחזרו למלאי.
---------------------------------------------------------
*/
async function releaseReservationBooksAndOffer(reservationId) {
  const normalizedReservationId = Number(reservationId);

  if (
    !Number.isInteger(normalizedReservationId) ||
    normalizedReservationId <= 0
  ) {
    return [];
  }

  const releasedBookIds = await waitingListQueries.releaseLoansForReservation(
    normalizedReservationId,
  );

  return offerReleasedBooks(releasedBookIds);
}

/*
=========================================================
ייצוא השירותים

הפונקציות מיוצאות כדי לאפשר שימוש בהן מתוך:
- waitingListService.
- waitingListScheduler.
- נתיבי הזמנת ספר.
- נתיבי הזמנת וביטול מקום ישיבה.
=========================================================
*/
module.exports = {
  completeOffer,
  processExpiredOffers,
  releaseFinishedLoansAndOfferBooks,
  releaseReservationBooksAndOffer,
};
