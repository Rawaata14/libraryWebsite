/*
=========================================================
waitingListService.js

תיאור הקובץ:
קובץ שירות מרכזי המשמש כחזית אחידה לכל פעולות
רשימות ההמתנה במערכת.

מטרת הקובץ:
לאפשר לנתיבי ה-Backend לעבוד מול שירות מרכזי אחד,
מבלי לדעת באיזה קובץ פנימי נמצאת כל פעולה.

החלוקה הפנימית:
- bookWaitingListService:
  פעולות הקשורות לרשימת המתנה לספרים.

- seatWaitingListService:
  פעולות הקשורות לרשימת המתנה למקומות ישיבה.

- waitingListMaintenanceService:
  טיפול בהצעות שפג תוקפן, החזרת ספרים למלאי
  והעברת הצעות למשתמש הבא.

- waitingListQueries:
  פעולות משותפות לקריאת רשימות ההמתנה של משתמש
  או של ספרנית.

יתרון החלוקה:
קובץ זה נשאר קצר וברור, בעוד שהלוגיקה העסקית
והשאילתות מחולקות לקבצים לפי תחום אחריות.
=========================================================
*/

const waitingListQueries = require("../database/queries/waitingListQueries");

const bookWaitingListService = require("./bookWaitingListService");

const seatWaitingListService = require("./seatWaitingListService");

const waitingListMaintenanceService = require("./waitingListMaintenanceService");

/*
---------------------------------------------------------
getMyWaitingLists

תפקיד:
מחזירה למשתמש המחובר את כל רשימות ההמתנה שלו.

הרשימות כוללות:
- המתנות לספרים.
- המתנות למקומות ישיבה.

פרמטר:
- userId:
  מזהה המשתמש המחובר מתוך ה-session.

אבטחה:
הפונקציה אינה מקבלת מזהה משתמש מה-Frontend.
המזהה חייב להגיע מה-session כדי שמשתמש לא יוכל
לבקש את רשימות ההמתנה של משתמש אחר.

ערך מוחזר:
אובייקט הכולל:
- success.
- books.
- seats.
---------------------------------------------------------
*/
async function getMyWaitingLists(userId) {
  const normalizedUserId = Number(userId);

  if (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0) {
    return {
      success: false,
      status: 401,
      message: "Authentication is required",
      books: [],
      seats: [],
    };
  }

  const waitingLists =
    await waitingListQueries.getUserWaitingLists(normalizedUserId);

  return {
    success: true,
    books: Array.isArray(waitingLists.books) ? waitingLists.books : [],
    seats: Array.isArray(waitingLists.seats) ? waitingLists.seats : [],
  };
}

/*
---------------------------------------------------------
getAllWaitingLists

תפקיד:
מחזירה את כל רשימות ההמתנה עבור אזור הניהול
של הספרנית.

הרשימות כוללות:
- כל המשתמשים שממתינים לספרים.
- כל המשתמשים שממתינים למקומות ישיבה.
- מצב כל המתנה.
- מיקום המשתמש בתור.
- פרטי הספר או המקום.
- זמני ההצעה, אם קיימת הצעה פעילה.

אבטחה:
בדיקת תפקיד הספרנית מתבצעת בנתיב באמצעות
middleware. השירות עצמו מתמקד בלוגיקה העסקית
ובהחזרת הנתונים.

ערך מוחזר:
אובייקט הכולל:
- success.
- books.
- seats.
---------------------------------------------------------
*/
async function getAllWaitingLists() {
  const waitingLists = await waitingListQueries.getAllWaitingLists();

  return {
    success: true,
    books: Array.isArray(waitingLists.books) ? waitingLists.books : [],
    seats: Array.isArray(waitingLists.seats) ? waitingLists.seats : [],
  };
}

/*
---------------------------------------------------------
cancelWaitingEntry

תפקיד:
מבטלת רשומת המתנה של המשתמש המחובר.

פרמטרים:
- type:
  סוג רשימת ההמתנה.
  הערכים האפשריים:
  "book" או "seat".

- waitingId:
  מזהה הרשומה ברשימת ההמתנה.

- userId:
  מזהה המשתמש המחובר.

חלוקת אחריות:
הפונקציה בוחרת את השירות המתאים לפי סוג ההמתנה:
- ספר מועבר ל-cancelBookWaitingEntry.
- מקום מועבר ל-cancelSeatWaitingEntry.

המשתמש יכול לבטל רק רשומה השייכת לו.
בדיקה זו מתבצעת גם בתוך שירות התחום וגם בשאילתת
העדכון במסד הנתונים.

כאשר מבטלים הצעה פעילה:
השירות המתאים מנסה להעביר מיד את ההצעה
למשתמש הבא בתור.
---------------------------------------------------------
*/
async function cancelWaitingEntry(type, waitingId, userId) {
  const normalizedType = String(type || "")
    .trim()
    .toLowerCase();

  const normalizedWaitingId = Number(waitingId);
  const normalizedUserId = Number(userId);

  if (!Number.isInteger(normalizedWaitingId) || normalizedWaitingId <= 0) {
    return {
      success: false,
      status: 400,
      message: "Invalid waiting-list entry ID",
    };
  }

  if (!Number.isInteger(normalizedUserId) || normalizedUserId <= 0) {
    return {
      success: false,
      status: 401,
      message: "Authentication is required",
    };
  }

  if (normalizedType === "book") {
    return bookWaitingListService.cancelBookWaitingEntry(
      normalizedWaitingId,
      normalizedUserId,
    );
  }

  if (normalizedType === "seat") {
    return seatWaitingListService.cancelSeatWaitingEntry(
      normalizedWaitingId,
      normalizedUserId,
    );
  }

  return {
    success: false,
    status: 400,
    message: 'Invalid waiting-list type. Use "book" or "seat".',
  };
}

/*
=========================================================
ייצוא השירות המרכזי

הקובץ מייצא:
1. פעולות משותפות המוגדרות ישירות בקובץ.
2. את כל פעולות רשימת ההמתנה לספרים.
3. את כל פעולות רשימת ההמתנה למקומות.
4. את כל פעולות התחזוקה האוטומטיות.

כך קבצים אחרים יכולים לייבא שירות אחד:

const waitingListService = require(
  "../services/waitingListService"
);

ולהשתמש בפעולה הנדרשת בלי לייבא מספר שירותים.
=========================================================
*/
module.exports = {
  getMyWaitingLists,
  getAllWaitingLists,
  cancelWaitingEntry,

  ...bookWaitingListService,
  ...seatWaitingListService,
  ...waitingListMaintenanceService,
};
