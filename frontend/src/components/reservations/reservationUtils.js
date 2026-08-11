/*
=========================================================
reservationUtils.js

תיאור הקובץ:
פונקציות עזר עבור ניהול ותצוגת הזמנות המקומות.

הקובץ כולל:
- עיצוב תאריך ושעה.
- עיצוב שם אזור.
- המרת סטטוס לטקסט ידידותי.
- התאמת סטטוס למחלקת CSS.
- בדיקה אם הזמנה בוטלה.
- סינון רשימת הזמנות.
- חישוב מספר הזמנות פעילות.
- חישוב מספר הזמנות שבוטלו.

הפונקציות בקובץ הן פונקציות טהורות:
הן אינן פונות לשרת ואינן תלויות ב-React.
=========================================================
*/

/*
---------------------------------------------------------
formatReservationDate

תפקיד:
ממירה תאריך שמתקבל מהשרת לפורמט:
DD/MM/YYYY.
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
מקצרת שעה שמתקבלת מהמסד
לפורמט HH:MM.
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
ממירה ערך מיקום ממסד הנתונים
לטקסט ידידותי לתצוגה.

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
מחזירה את הטקסט שיוצג למשתמש
עבור סטטוס ההזמנה.
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
מחזירה מחלקת CSS המתאימה
לסטטוס ההזמנה.
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
בודקת אם סטטוס ההזמנה מייצג
הזמנה שבוטלה.
---------------------------------------------------------
*/
export const isCancelledStatus = (status) =>
  ["cancelled", "canceled"].includes(status?.toLowerCase());

/*
---------------------------------------------------------
filterReservations

תפקיד:
מסננת רשימת הזמנות לפי:
- טקסט חיפוש.
- סטטוס.

החיפוש כולל:
- שם משתמש.
- אימייל.
- טלפון.
- מספר כיסא.
- אזור.
- סוג המקום.
- מזהה הזמנה.

הפונקציה אינה משנה את הרשימה המקורית.
---------------------------------------------------------
*/
export const filterReservations = (reservations, searchText, statusFilter) => {
  const normalizedSearch = String(searchText || "")
    .trim()
    .toLowerCase();

  return reservations.filter((reservation) => {
    const normalizedStatus = reservation.status?.toLowerCase();

    /*
      occupied ו-confirmed מייצגים בממשק
      את אותו סטטוס: Confirmed.
    */
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "occupied" &&
        ["occupied", "confirmed"].includes(normalizedStatus)) ||
      normalizedStatus === statusFilter;

    const searchableValues = [
      reservation.fullName,
      reservation.email,
      reservation.phone,
      reservation.seatId,
      reservation.location,
      reservation.seatType,
      reservation.reservationId,
    ]
      .filter((value) => value !== null && value !== undefined)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !normalizedSearch || searchableValues.includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });
};

/*
---------------------------------------------------------
countActiveReservations

תפקיד:
מחזירה את מספר ההזמנות הפעילות.

occupied ו-confirmed נחשבים
לסטטוס פעיל.
---------------------------------------------------------
*/
export const countActiveReservations = (reservations) =>
  reservations.filter((reservation) =>
    ["occupied", "confirmed"].includes(reservation.status?.toLowerCase()),
  ).length;

/*
---------------------------------------------------------
countCancelledReservations

תפקיד:
מחזירה את מספר ההזמנות שבוטלו.
---------------------------------------------------------
*/
export const countCancelledReservations = (reservations) =>
  reservations.filter((reservation) => isCancelledStatus(reservation.status))
    .length;
