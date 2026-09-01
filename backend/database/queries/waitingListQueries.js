/*
=========================================================
waitingListQueries.js

תיאור הקובץ:
קובץ חיבור מרכזי לשכבות השאילתות של
מערכת רשימות ההמתנה.

הקובץ מחבר בין:
- bookWaitingListQueries.js
- seatWaitingListQueries.js
- waitingListMaintenanceQueries.js

למה הקובץ נוצר:
שכבת השירות יכולה לייבא מקור אחד,
בעוד שהשאילתות עצמן נשארות מפוצלות
לפי תחומי אחריות.

הקובץ אינו מכיל SQL.
הוא רק מאחד ומתווך בין המודולים.
=========================================================
*/

const bookWaitingListQueries = require("./bookWaitingListQueries");

const seatWaitingListQueries = require("./seatWaitingListQueries");

const waitingListMaintenanceQueries = require("./waitingListMaintenanceQueries");

/*
---------------------------------------------------------
getUserWaitingLists

תפקיד:
שולפת במקביל את שתי רשימות ההמתנה
של המשתמש:

- ספרים.
- מקומות.

שימוש ב-Promise.all מאפשר לשתי השאילתות
לרוץ במקביל במקום להמתין לכל אחת בנפרד.

@param {number} userId
מזהה המשתמש המחובר.

@returns {Promise<Object>}
מחזירה:
{
  bookEntries: [],
  seatEntries: []
}
---------------------------------------------------------
*/
async function getUserWaitingLists(userId) {
  const [bookEntries, seatEntries] = await Promise.all([
    bookWaitingListQueries.getUserBookWaitingLists(userId),

    seatWaitingListQueries.getUserSeatWaitingLists(userId),
  ]);

  return {
    bookEntries,
    seatEntries,
  };
}

/*
---------------------------------------------------------
getAllWaitingLists

תפקיד:
שולפת עבור הספרנית את כל רשימות ההמתנה
הפעילות של ספרים ושל מקומות.

השאילתות רצות במקביל משום שאין תלות
בין שתי התוצאות.

@returns {Promise<Object>}
מחזירה:
{
  books: [],
  seats: []
}
---------------------------------------------------------
*/
async function getAllWaitingLists() {
  const [books, seats] = await Promise.all([
    bookWaitingListQueries.getAllBookWaitingLists(),

    seatWaitingListQueries.getAllSeatWaitingLists(),
  ]);

  return {
    books,
    seats,
  };
}

/*
---------------------------------------------------------
getExpiredOffers

תפקיד:
שולפת במקביל הצעות ספרים ומקומות
שפג תוקפן.

@param {string} currentDateTime
המועד הנוכחי לפי שעון ישראל.

@returns {Promise<Object>}
מחזירה:
{
  books: [],
  seats: []
}
---------------------------------------------------------
*/
async function getExpiredOffers(currentDateTime) {
  const [books, seats] = await Promise.all([
    waitingListMaintenanceQueries.getExpiredBookOffers(currentDateTime),

    waitingListMaintenanceQueries.getExpiredSeatOffers(currentDateTime),
  ]);

  return {
    books,
    seats,
  };
}

/*
---------------------------------------------------------
expireOffer

תפקיד:
מסמנת הצעה שפג תוקפה לפי סוג הרשימה.

type יכול להיות:
- book
- seat

@param {string} type
סוג רשימת ההמתנה.

@param {number} waitingId
מזהה רשומת ההמתנה.

@returns {Promise<Object>}
תוצאת פעולת העדכון.
---------------------------------------------------------
*/
async function expireOffer(type, waitingId) {
  if (type === "book") {
    return waitingListMaintenanceQueries.expireBookOffer(waitingId);
  }

  if (type === "seat") {
    return waitingListMaintenanceQueries.expireSeatOffer(waitingId);
  }

  throw new Error("Invalid waiting-list type.");
}

/*
---------------------------------------------------------
completeOffer

תפקיד:
מסמנת הצעה כ-completed לאחר שהמשתמש
ביצע את ההזמנה בהצלחה.

type יכול להיות:
- book
- seat

@param {string} type
סוג רשימת ההמתנה.

@param {number} waitingId
מזהה רשומת ההמתנה.

@param {string} completedAt
מועד השלמת ההצעה לפי שעון ישראל.

@returns {Promise<Object>}
תוצאת פעולת העדכון.
---------------------------------------------------------
*/
async function completeOffer(type, waitingId, completedAt) {
  if (type === "book") {
    return waitingListMaintenanceQueries.completeBookOffer(
      waitingId,
      completedAt,
    );
  }

  if (type === "seat") {
    return waitingListMaintenanceQueries.completeSeatOffer(
      waitingId,
      completedAt,
    );
  }

  throw new Error("Invalid waiting-list type.");
}

/*
---------------------------------------------------------
releaseFinishedLoans

תפקיד:
מעבירה לשכבת התחזוקה את הבקשה לסיום
השאלות שהגיע זמן החזרתן.

הפונקציה נשמרת בקובץ החיבור כדי ששכבת
השירות לא תהיה תלויה ישירות במודול
התחזוקה.
---------------------------------------------------------
*/
async function releaseFinishedLoans(libraryDate, libraryTime) {
  return waitingListMaintenanceQueries.releaseFinishedLoans(
    libraryDate,
    libraryTime,
  );
}

/*
---------------------------------------------------------
releaseLoansForReservation

תפקיד:
מחזירה למלאי ספרים המקושרים להזמנת
מקום שבוטלה.

@param {number} reservationId
מזהה הזמנת המקום שבוטלה.

@returns {Promise<Array<number>>}
מזהי הספרים שחזרו למלאי.
---------------------------------------------------------
*/
async function releaseLoansForReservation(reservationId) {
  return waitingListMaintenanceQueries.releaseLoansForReservation(
    reservationId,
  );
}

/*
ייצוא ממשק משותף לשכבת השירות.

הפונקציות הייעודיות מגיעות מהמודולים
המפוצלים, והפונקציות המאחדות מוגדרות
בקובץ הנוכחי.
*/
module.exports = {
  /*
  שאילתות המתנת ספר.
  */
  getBook: bookWaitingListQueries.getBook,

  getActiveBookEntry: bookWaitingListQueries.getActiveBookEntry,

  getEligibleSeatReservation: bookWaitingListQueries.getEligibleSeatReservation,

  addBookEntry: bookWaitingListQueries.addBookEntry,

  cancelBookEntry: bookWaitingListQueries.cancelBookEntry,

  getFirstWaitingForBook: bookWaitingListQueries.getFirstWaitingForBook,

  offerBookEntry: bookWaitingListQueries.offerBookEntry,

  getBookOffer: bookWaitingListQueries.getBookOffer,

  hasActiveBookOffer: bookWaitingListQueries.hasActiveBookOffer,

  /*
  שאילתות המתנת מקום.
  */
  getSeat: seatWaitingListQueries.getSeat,

  hasSeatReservation: seatWaitingListQueries.hasSeatReservation,

  getActiveSeatEntry: seatWaitingListQueries.getActiveSeatEntry,

  addSeatEntry: seatWaitingListQueries.addSeatEntry,

  cancelSeatEntry: seatWaitingListQueries.cancelSeatEntry,

  getFirstWaitingForSeat: seatWaitingListQueries.getFirstWaitingForSeat,

  offerSeatEntry: seatWaitingListQueries.offerSeatEntry,

  getSeatOffer: seatWaitingListQueries.getSeatOffer,

  hasActiveSeatOffer: seatWaitingListQueries.hasActiveSeatOffer,

  /*
  פעולות משותפות ותחזוקה.
  */
  getUserWaitingLists,
  getAllWaitingLists,
  getExpiredOffers,
  expireOffer,
  completeOffer,
  releaseFinishedLoans,
  releaseLoansForReservation,
};
