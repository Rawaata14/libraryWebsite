/*
=========================================================
reservationUtils.js

תיאור הקובץ:
פונקציות עזר עבור תצוגת הזמנות המקומות.

הקובץ כולל:
- עיצוב תאריך ושעה.
- המרת מיקום לטקסט קריא.
- המרת סטטוס לטקסט ולמחלקת CSS.
- בדיקה האם הזמנה בוטלה.

הפונקציות בקובץ הן פונקציות טהורות:
הן אינן משנות נתונים ואינן תלויות ב-React.
=========================================================
*/

/*
---------------------------------------------------------
formatReservationDate

תפקיד:
ממירה תאריך שמתקבל מהשרת לפורמט DD/MM/YYYY.
---------------------------------------------------------
*/
export const formatReservationDate = (dateValue) => {
  if (!dateValue) {
    return "-";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

/*
---------------------------------------------------------
formatReservationTime

תפקיד:
מקצרת שעה שמתקבלת ממסד הנתונים לפורמט HH:MM.
---------------------------------------------------------
*/
export const formatReservationTime = (timeValue) => {
  if (!timeValue) {
    return "-";
  }

  return String(timeValue).substring(0, 5);
};

/*
---------------------------------------------------------
formatLocation

תפקיד:
ממירה ערך מיקום ממסד הנתונים לטקסט קריא.

דוגמה:
reading-area -> Reading Area
---------------------------------------------------------
*/
export const formatLocation = (location) => {
  if (!location) {
    return "-";
  }

  return String(location)
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/*
---------------------------------------------------------
getStatusLabel

תפקיד:
מחזירה טקסט ידידותי להצגת סטטוס ההזמנה.
---------------------------------------------------------
*/
export const getStatusLabel = (status) => {
  switch (status?.toLowerCase()) {
    case "occupied":
    case "confirmed":
      return "Confirmed";

    case "cancelled":
    case "canceled":
      return "Cancelled";

    case "completed":
      return "Completed";

    default:
      return status || "Unknown";
  }
};

/*
---------------------------------------------------------
getStatusClass

תפקיד:
מחזירה מחלקת CSS המתאימה לסטטוס ההזמנה.
---------------------------------------------------------
*/
export const getStatusClass = (status) => {
  switch (status?.toLowerCase()) {
    case "occupied":
    case "confirmed":
      return "confirmed";

    case "cancelled":
    case "canceled":
      return "cancelled";

    case "completed":
      return "completed";

    default:
      return "default";
  }
};

/*
---------------------------------------------------------
isCancelledStatus

תפקיד:
בודקת אם סטטוס ההזמנה מייצג הזמנה שבוטלה.
---------------------------------------------------------
*/
export const isCancelledStatus = (status) =>
  ["cancelled", "canceled"].includes(status?.toLowerCase());
