/*
=========================================================
waitingListHelpers.js

תיאור הקובץ:
פונקציות עזר משותפות לשירותי רשימות ההמתנה.

אחריות:
- נרמול תאריך.
- נרמול שעה.
- שליחת מייל אופציונלי.
- מניעת כפילות בין שירות הספרים,
  שירות המקומות ושירות התחזוקה.

למה הקובץ נוצר:
שירותי הספרים והמקומות זקוקים לאותן
פעולות עזר, אך אין צורך להעתיק את הקוד
לכל שירות בנפרד.
=========================================================
*/

const { sendLibraryEmail } = require("../utils/mailer");

/*
---------------------------------------------------------
normalizeTime

תפקיד:
מנרמלת שעה לפורמט:

HH:MM:SS

הפונקציה מקבלת:
- HH:MM
- HH:MM:SS

אם התקבל HH:MM:
השניות מתווספות כ-00.

אם המבנה אינו תקין:
מוחזרת מחרוזת ריקה.

@param {string} value
ערך השעה שרוצים לנרמל.

@returns {string}
שעה מנורמלת או מחרוזת ריקה.
---------------------------------------------------------
*/
function normalizeTime(value) {
  const match = String(value || "")
    .trim()
    .match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);

  if (!match) {
    return "";
  }

  const hours = Number(match[1]);

  const minutes = Number(match[2]);

  const seconds = Number(match[3] || "0");

  /*
  בדיקת טווחי שעה תקינים.
  */
  if (
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 59
  ) {
    return "";
  }

  return `${match[1]}:` + `${match[2]}:` + `${match[3] || "00"}`;
}

/*
---------------------------------------------------------
normalizeDate

תפקיד:
מנרמלת תאריך לפורמט:

YYYY-MM-DD

הפונקציה בודקת:
- שמבנה התאריך תקין.
- שהחודש והיום מייצגים תאריך אמיתי.

לדוגמה:
2026-02-30 יידחה כתאריך שאינו קיים.

@param {string} value
ערך התאריך שרוצים לנרמל.

@returns {string}
תאריך מנורמל או מחרוזת ריקה.
---------------------------------------------------------
*/
function normalizeDate(value) {
  const match = String(value || "")
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return "";
  }

  const year = Number(match[1]);

  const month = Number(match[2]);

  const day = Number(match[3]);

  /*
  יצירת תאריך באמצעות UTC לצורך אימות בלבד.

  השימוש ב-UTC כאן אינו משנה את שעון
  הספרייה, משום שאיננו מחשבים את הזמן
  הנוכחי אלא רק בודקים שהערכים קיימים.
  */
  const date = new Date(Date.UTC(year, month - 1, day));

  const isValidDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  if (!isValidDate) {
    return "";
  }

  return `${match[1]}-` + `${match[2]}-` + `${match[3]}`;
}

/*
---------------------------------------------------------
escapeHtml

תפקיד:
ממירה תווים מיוחדים לערכים בטוחים לשילוב
בתוך תוכן HTML של מייל.

למה הפונקציה נדרשת:
שמות משתמשים, שמות ספרים ואזורים עשויים
להגיע ממסד הנתונים או מקלט משתמש.

אסור לשלב אותם ישירות ב-HTML בלי נרמול.

@param {unknown} value
הערך שרוצים לשלב במייל.

@returns {string}
טקסט בטוח לשילוב ב-HTML.
---------------------------------------------------------
*/
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/*
---------------------------------------------------------
sendOptionalEmail

תפקיד:
שולחת מייל באמצעות שירות mailer המרכזי.

המייל מוגדר כפעולה אופציונלית:
- ההתראה בתוך האתר נשמרת גם אם המייל נכשל.
- כשל בשליחת מייל אינו מבטל את ההצעה.
- השרת אינו קורס כאשר אין עדיין סיסמה.

@param {string} toEmail
כתובת הנמען.

@param {string} subject
נושא המייל.

@param {string} htmlMessage
תוכן HTML.

@param {string} textMessage
תוכן טקסט רגיל.

@returns {Promise<Object>}
תוצאת שליחת המייל.
---------------------------------------------------------
*/
async function sendOptionalEmail(toEmail, subject, htmlMessage, textMessage) {
  /*
  אם למשתמש אין כתובת מייל,
  אין אפשרות לבצע שליחה.
  */
  if (!toEmail) {
    return {
      success: false,

      skipped: true,

      error: "The user does not have an email address.",
    };
  }

  const result = await sendLibraryEmail(
    toEmail,
    subject,
    htmlMessage,
    textMessage,
  );

  /*
  השגיאה נרשמת לצורכי בדיקה,
  אך אינה נזרקת לשכבה שקראה לפונקציה.
  */
  if (!result.success) {
    console.error("Waiting-list email was not sent:", result.error);
  }

  return result;
}

module.exports = {
  normalizeTime,
  normalizeDate,
  escapeHtml,
  sendOptionalEmail,
};
