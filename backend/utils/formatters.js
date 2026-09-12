/**
 * @file formatters.js
 * @description קובץ שירות מרכזי לניהול, נרמול ווולידציה של תאריכים ושעות עבור אזור הזמן של הספרייה.
 */

const LIBRARY_TIME_ZONE = "Asia/Jerusalem";

/*
---------------------------------------------------------
getLibraryDateTime

תפקיד:
מחזירה תאריך ושעה נוכחיים לפי שעון ישראל.
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
מנרמלת תאריך לפורמט YYYY-MM-DD ומוודאת שהוא תאריך אמיתי (כולל בדיקת UTC).
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

  const date = new Date(Date.UTC(year, month - 1, day));
  const isValidDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  if (!isValidDate) {
    return "";
  }

  return `${match[1]}-${match[2]}-${match[3]}`;
}

/*
---------------------------------------------------------
normalizeTime

תפקיד:
מנרמלת שעה לפורמט תקני (תומך גם בשניות אופציונליות ומאמת טווחים).
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

  // מחזיר HH:MM:SS אם צוין, או HH:MM תקני
  return `${match[1]}:${match[2]}` + (match[3] ? `:${match[3]}` : "");
}

/*
---------------------------------------------------------
isValidDate

תפקיד:
בודקת שמבנה התאריך תקין ושזהו תאריך אמיתי וקיים בקלנדר.
---------------------------------------------------------
*/
function isValidDate(value) {
  return normalizeDate(value) !== "";
}

/*
---------------------------------------------------------
isValidTime

תפקיד:
בודקת שמבנה השעה תקין ונופל בטווח השעות החוקי (00-23).
---------------------------------------------------------
*/
function isValidTime(value) {
  return normalizeTime(value) !== "";
}

module.exports = {
  getLibraryDateTime,
  normalizeDate,
  normalizeTime,
  isValidDate,
  isValidTime,
};
