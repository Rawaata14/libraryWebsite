/*
=========================================================
formatters.js

תיאור הקובץ:
אוסף פונקציות עזר (Helpers) מרוכז לצד השרת (Backend)
לניהול, נרמול, אימות וחישובי זמנים לפי שעון ישראל.

אחריות:
- שליפת תאריך ושעה נוכחיים ברזולוציה מלאה (כולל שניות ו-sqlDateTime) לפי שעון ישראל (Asia/Jerusalem).
- הוספת דקות למועד קיים (לצורך חישוב תפוגת הצעות).
- נרמול מחרוזות תאריך ובדיקת תקינותן הקלנדרית.
- נרמול מחרוזות שעה ואימות טווחים חוקיים (00-23).
- מתן פונקציות אימות ייעודיות (isValidDate, isValidTime).
=========================================================
*/

const LIBRARY_TIME_ZONE = "Asia/Jerusalem";

/*
---------------------------------------------------------
getLibraryDateTime

תפקיד:
מחזירה את התאריך והשעה הנוכחיים לפי שעון
הספרייה בישראל ברזולוציה מלאה (כולל שניות ופורמט ל-SQL).
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
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(new Date()).reduce((result, part) => {
    if (part.type !== "literal") {
      result[part.type] = part.value;
    }
    return result;
  }, {});

  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const time = `${parts.hour}:${parts.minute}:${parts.second}`;

  return {
    date,
    time,
    sqlDateTime: `${date} ${time}`,
    dateTimeKey: `${date}T${parts.hour}:${parts.minute}`,
  };
}

/*
---------------------------------------------------------
addMinutesToSqlDateTime

תפקיד:
מוסיפה מספר דקות למועד בפורמט MySQL בצורה מדויקת
ללא תלות באזור הזמן של השרת.
---------------------------------------------------------
*/
function addMinutesToSqlDateTime(sqlDateTime, minutes) {
  const [datePart, timePart] = sqlDateTime.split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minute, seconds] = timePart.split(":").map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day, hours, minute + minutes, seconds),
  );

  const pad = (value) => String(value).padStart(2, "0");

  return (
    `${date.getUTCFullYear()}-` +
    `${pad(date.getUTCMonth() + 1)}-` +
    `${pad(date.getUTCDate())} ` +
    `${pad(date.getUTCHours())}:` +
    `${pad(date.getUTCMinutes())}:` +
    `${pad(date.getUTCSeconds())}`
  );
}

/*
---------------------------------------------------------
normalizeDate

תפקיד:
מנרמלת תאריך לפורמט YYYY-MM-DD ומוודאת שהוא תאריך אמיתי.
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

  return isValidDate ? `${match[1]}-${match[2]}-${match[3]}` : "";
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

  return `${match[1]}:${match[2]}` + (match[3] ? `:${match[3]}` : "");
}

/*
---------------------------------------------------------
isValidDate & isValidTime

תפקיד:
בדיקת תקינות קלנדרית של תאריכים ושעות.
---------------------------------------------------------
*/
function isValidDate(value) {
  return normalizeDate(value) !== "";
}

function isValidTime(value) {
  return normalizeTime(value) !== "";
}

module.exports = {
  LIBRARY_TIME_ZONE,
  getLibraryDateTime,
  addMinutesToSqlDateTime,
  normalizeDate,
  normalizeTime,
  isValidDate,
  isValidTime,
};
