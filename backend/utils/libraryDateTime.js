/*
=========================================================
libraryDateTime.js

תיאור הקובץ:
פונקציות זמן משותפות לצד ה-Backend.

אחריות:
- חישוב התאריך והשעה לפי שעון ישראל.
- יצירת מועד בפורמט המתאים ל-MySQL.
- הוספת דקות למועד קיים.

למה הקובץ נוצר:
שרת Node או MySQL עשויים לפעול לפי UTC.
שימוש במקור זמן מרכזי מונע שגיאות בתאריך,
בתפוגת הצעות וברשימות ההמתנה.
=========================================================
*/

const LIBRARY_TIME_ZONE = "Asia/Jerusalem";

/*
---------------------------------------------------------
getLibraryDateTime

תפקיד:
מחזירה את התאריך והשעה הנוכחיים לפי שעון
הספרייה בישראל.

ערכים מוחזרים:
- date: תאריך בפורמט YYYY-MM-DD.
- time: שעה בפורמט HH:MM:SS.
- sqlDateTime: מועד המתאים לשמירה ב-MySQL.
- dateTimeKey: מועד המתאים להשוואות בקוד.
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

    dateTimeKey: `${date}T${time}`,
  };
}

/*
---------------------------------------------------------
addMinutesToSqlDateTime

תפקיד:
מוסיפה מספר דקות למועד בפורמט MySQL.

למה הפונקציה נוצרה:
הצעה לספר או למקום מוגבלת בזמן.

לדוגמה:
- הצעת ספר תקפה ל-30 דקות.
- הצעת מקום תקפה ל-15 דקות.

החישוב נעשה בקוד כדי לא להיות תלויים באזור
הזמן שמוגדר בשרת MySQL.
---------------------------------------------------------
*/
function addMinutesToSqlDateTime(sqlDateTime, minutes) {
  const [datePart, timePart] = sqlDateTime.split(" ");

  const [year, month, day] = datePart.split("-").map(Number);

  const [hours, minute, seconds] = timePart.split(":").map(Number);

  /*
  משתמשים ב-UTC רק ככלי לחיבור דקות.

  הערכים שהוזנו כבר מייצגים את שעון ישראל,
  ולכן לאחר החישוב קוראים את חלקי ה-UTC
  בלי לבצע המרת אזור זמן נוספת.
  */
  const date = new Date(
    Date.UTC(year, month - 1, day, hours, minute + minutes, seconds),
  );

  /*
  -------------------------------------------------------
  pad

  תפקיד:
  מוסיפה אפס לפני מספר חד-ספרתי.

  לדוגמה:
  7 הופך ל-07.
  -------------------------------------------------------
  */
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

module.exports = {
  LIBRARY_TIME_ZONE,
  getLibraryDateTime,
  addMinutesToSqlDateTime,
};
