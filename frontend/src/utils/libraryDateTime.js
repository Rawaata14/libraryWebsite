/*
=========================================================
libraryDateTime.js

תיאור הקובץ:
פונקציות משותפות לטיפול בתאריך ובשעה של הספרייה.

כל חישובי "היום" ו-"עכשיו" מתבצעים לפי אזור הזמן
של ישראל, כדי למנוע מעבר שגוי ליום הקודם בגלל UTC.
=========================================================
*/

const LIBRARY_TIME_ZONE = "Asia/Jerusalem";

/*
---------------------------------------------------------
getDateTimeParts

תפקיד:
מחזירה את חלקי התאריך והשעה לפי שעון ישראל.
---------------------------------------------------------
*/
const getDateTimeParts = (date = new Date()) => {
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

  const parts = formatter.formatToParts(date);

  return parts.reduce((result, part) => {
    if (part.type !== "literal") {
      result[part.type] = part.value;
    }

    return result;
  }, {});
};

/*
---------------------------------------------------------
getLibraryDateValue

תפקיד:
מחזירה את התאריך הנוכחי בישראל בפורמט YYYY-MM-DD.
---------------------------------------------------------
*/
export const getLibraryDateValue = (date = new Date()) => {
  const parts = getDateTimeParts(date);

  return `${parts.year}-${parts.month}-${parts.day}`;
};

/*
---------------------------------------------------------
getLibraryTimeValue

תפקיד:
מחזירה את השעה הנוכחית בישראל בפורמט HH:MM.
---------------------------------------------------------
*/
export const getLibraryTimeValue = (date = new Date()) => {
  const parts = getDateTimeParts(date);

  return `${parts.hour}:${parts.minute}`;
};

/*
---------------------------------------------------------
getLibraryDateTimeKey

תפקיד:
מחזירה מפתח שניתן להשוואה מילונית:
YYYY-MM-DDTHH:MM.

כך אפשר להשוות מועדי הזמנות בלי להמיר DATE מהמסד
ל-UTC ובלי לגרום לשינוי של יום.
---------------------------------------------------------
*/
export const getLibraryDateTimeKey = (date = new Date()) =>
  `${getLibraryDateValue(date)}T${getLibraryTimeValue(date)}`;

/*
---------------------------------------------------------
normalizeReservationDate

תפקיד:
מחלצת תאריך בפורמט YYYY-MM-DD מערך שמתקבל מהשרת.

הפונקציה אינה משתמשת ב-new Date, ולכן תאריך מסוג
DATE אינו זז ליום הקודם או הבא.
---------------------------------------------------------
*/
export const normalizeReservationDate = (dateValue) => {
  if (!dateValue) {
    return "";
  }

  const value = String(dateValue).trim();
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

  return match ? `${match[1]}-${match[2]}-${match[3]}` : "";
};

/*
---------------------------------------------------------
normalizeReservationTime

תפקיד:
מחזירה שעה בפורמט HH:MM.
---------------------------------------------------------
*/
export const normalizeReservationTime = (timeValue) => {
  if (!timeValue) {
    return "";
  }

  const match = String(timeValue)
    .trim()
    .match(/^(\d{2}):(\d{2})/);

  return match ? `${match[1]}:${match[2]}` : "";
};

/*
---------------------------------------------------------
getReservationDateTimeKey

תפקיד:
יוצרת מפתח השוואה מתאריך ההזמנה ומשדה שעה נבחר.
---------------------------------------------------------
*/
export const getReservationDateTimeKey = (
  reservation,
  timeField = "startTime",
) => {
  const date = normalizeReservationDate(
    reservation?.reservationDate || reservation?.date,
  );

  const time = normalizeReservationTime(reservation?.[timeField]);

  if (!date || !time) {
    return "";
  }

  return `${date}T${time}`;
};
