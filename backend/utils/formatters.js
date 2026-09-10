/**
 * @file dateUtils.js
 * @description קובץ שירות מרכזי לניהול, נרמול ווולידציה של תאריכים ושעות עבור אזור הזמן של הספרייה.
 * הקובץ מרכז את כל פעולות המניפולציה על תאריכים ושעות כדי להבטיח אחידות
 * במבנה הנתונים שנשלחים לבסיס הנתונים ומוצגים במערכת (מניעת תקלות פורמט ואפסים).
 */

const LIBRARY_TIME_ZONE = "Asia/Jerusalem";

/*
---------------------------------------------------------
getLibraryDateTime

תפקיד:
מחזירה תאריך ושעה נוכחיים לפי שעון ישראל.
משמש לסימון פעולות בזמן אמת בהתאם לאזור הזמן המוגדר במערכת.
---------------------------------------------------------
*/
function getLibraryDateTime() {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: LIBRARY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(new Date()).reduce((result, part) => {
    if (part.type !== "literal") {
      result[part.type] = part.value;
    }

    return result;
  }, {});

  const date = `${parts.year}-${parts.month}-${parts.day}`;

  const time = `${parts.hour}:${parts.minute}`;

  return {
    date,
    time,
    dateTimeKey: `${date}T${time}`,
  };
}

/*
---------------------------------------------------------
normalizeDate

תפקיד:
מחלצת ומחזירה תאריך נקי בפורמט התקני YYYY-MM-DD.
מונעת שגיאות בבסיס הנתונים במקרה שמחרוזת התאריך מגיעה 
עם נתונים נלווים (כמו אזורי זמן או חותמות זמן).
---------------------------------------------------------
*/
function normalizeDate(value) {
  if (!value) {
    return "";
  }

  const match = String(value)
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})/);

  return match ? `${match[1]}-${match[2]}-${match[3]}` : "";
}

/*
---------------------------------------------------------
normalizeTime

תפקיד:
מחלצת ומחזירה שעה נקייה בפורמט התקני HH:MM.
מנקה שאריות כמו שניות או שניות מיקרוניות מתוצאות שליפה במסד.
---------------------------------------------------------
*/
function normalizeTime(value) {
  if (!value) {
    return "";
  }

  const match = String(value)
    .trim()
    .match(/^(\d{2}):(\d{2})/);

  return match ? `${match[1]}:${match[2]}` : "";
}

/*
---------------------------------------------------------
isValidDate

תפקיד:
בודקת שמבנה התאריך תקין ושזהו תאריך אמיתי וקיים בקלנדר.
---------------------------------------------------------
*/
function isValidDate(value) {
  const normalizedDate = normalizeDate(value);

  if (!normalizedDate || normalizedDate !== String(value).trim()) {
    return false;
  }

  const [year, month, day] = normalizedDate.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/*
---------------------------------------------------------
isValidTime

תפקיד:
בודקת שמבנה השעה תקין ונופל בטווח השעות החוקי (00-23).
---------------------------------------------------------
*/
function isValidTime(value) {
  const normalizedTime = normalizeTime(value);

  if (!normalizedTime) {
    return false;
  }

  const [hours, minutes] = normalizedTime.split(":").map(Number);

  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

module.exports = {
  getLibraryDateTime,
  normalizeDate,
  normalizeTime,
  isValidDate,
  isValidTime,
};
