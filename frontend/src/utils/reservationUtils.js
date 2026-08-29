/*
=========================================================
reservationUtils.js

תיאור הקובץ:
פונקציות עזר עבור ניהול ותצוגת הזמנות המקומות.

תאריכי ההזמנות מטופלים כערכי לוח שנה ולא מומרים
ל-UTC, כדי למנוע מעבר שגוי ליום הקודם.
=========================================================
*/

import {
  getLibraryDateTimeKey,
  getReservationDateTimeKey,
  normalizeReservationDate,
  normalizeReservationTime,
} from "./libraryDateTime";

/*
---------------------------------------------------------
formatReservationDate

תפקיד:
ממירה תאריך לפורמט DD/MM/YYYY בלי לשנות אזור זמן.
---------------------------------------------------------
*/
export const formatReservationDate = (dateValue) => {
  const normalizedDate = normalizeReservationDate(dateValue);

  if (!normalizedDate) {
    return dateValue ? String(dateValue) : "-";
  }

  const [year, month, day] = normalizedDate.split("-");

  return `${day}/${month}/${year}`;
};

/*
---------------------------------------------------------
formatReservationTime

תפקיד:
מחזירה שעה בפורמט HH:MM.
---------------------------------------------------------
*/
export const formatReservationTime = (timeValue) =>
  normalizeReservationTime(timeValue) || "-";

/*
---------------------------------------------------------
formatLocation

תפקיד:
ממירה ערך מיקום לטקסט ידידותי.
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

    case "pending":
      return "Pending";

    case "completed":
      return "Completed";

    default:
      return status || "Unknown";
  }
};

/*
---------------------------------------------------------
getStatusClass
---------------------------------------------------------
*/
export const getStatusClass = (status) => {
  switch (status?.toLowerCase()) {
    case "occupied":
    case "confirmed":
      return "confirmed";

    case "pending":
      return "pending";

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
---------------------------------------------------------
*/
export const isCancelledStatus = (status) =>
  ["cancelled", "canceled"].includes(status?.toLowerCase());

/*
---------------------------------------------------------
filterReservations

תפקיד:
מסננת הזמנות לפי טקסט חיפוש וסטטוס.
---------------------------------------------------------
*/
export const filterReservations = (reservations, searchText, statusFilter) => {
  const normalizedSearch = String(searchText || "")
    .trim()
    .toLowerCase();

  return reservations.filter((reservation) => {
    const normalizedStatus = reservation.status?.toLowerCase();

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
---------------------------------------------------------
*/
export const countActiveReservations = (reservations) =>
  reservations.filter((reservation) =>
    ["occupied", "confirmed"].includes(reservation.status?.toLowerCase()),
  ).length;

/*
---------------------------------------------------------
countCancelledReservations
---------------------------------------------------------
*/
export const countCancelledReservations = (reservations) =>
  reservations.filter((reservation) => isCancelledStatus(reservation.status))
    .length;

/*
---------------------------------------------------------
getReservationStartDateTime

תפקיד:
מחזירה מפתח השוואה של מועד תחילת ההזמנה:
YYYY-MM-DDTHH:MM.
---------------------------------------------------------
*/
export const getReservationStartDateTime = (reservation) =>
  getReservationDateTimeKey(reservation, "startTime");

/*
---------------------------------------------------------
getReservationEndDateTime

תפקיד:
מחזירה מפתח השוואה של מועד סיום ההזמנה:
YYYY-MM-DDTHH:MM.

השם נשמר כדי לא לשבור קבצים שכבר משתמשים בפונקציה.
---------------------------------------------------------
*/
export const getReservationEndDateTime = (reservation) =>
  getReservationDateTimeKey(reservation, "endTime");

/*
---------------------------------------------------------
splitReservationsByTime

תפקיד:
מחלקת הזמנות ל-Upcoming ול-History.

הזמנה פעילה נשארת ב-Upcoming עד שעת הסיום.
הזמנה שבוטלה מופיעה בהיסטוריה.
---------------------------------------------------------
*/
export const splitReservationsByTime = (
  reservations,
  currentDateTimeKey = getLibraryDateTimeKey(),
) => {
  const upcomingReservations = reservations
    .filter((reservation) => {
      const reservationEnd = getReservationEndDateTime(reservation);

      return Boolean(
        reservationEnd &&
        reservationEnd >= currentDateTimeKey &&
        !isCancelledStatus(reservation.status),
      );
    })
    .sort((firstReservation, secondReservation) => {
      const firstDate = getReservationStartDateTime(firstReservation);

      const secondDate = getReservationStartDateTime(secondReservation);

      return firstDate.localeCompare(secondDate);
    });

  const pastReservations = reservations
    .filter((reservation) => {
      const reservationEnd = getReservationEndDateTime(reservation);

      return (
        !reservationEnd ||
        reservationEnd < currentDateTimeKey ||
        isCancelledStatus(reservation.status)
      );
    })
    .sort((firstReservation, secondReservation) => {
      const firstDate = getReservationEndDateTime(firstReservation);

      const secondDate = getReservationEndDateTime(secondReservation);

      return secondDate.localeCompare(firstDate);
    });

  return {
    upcomingReservations,
    pastReservations,
  };
};

/*
---------------------------------------------------------
countTodayReservations

תפקיד:
סופרת הזמנות פעילות שהתאריך שלהן הוא היום.
---------------------------------------------------------
*/
export const countTodayReservations = (reservations, todayStr) =>
  reservations.filter((reservation) => {
    const reservationDate = normalizeReservationDate(
      reservation.reservationDate || reservation.date,
    );

    const isActive = ["occupied", "confirmed"].includes(
      reservation.status?.toLowerCase(),
    );

    return reservationDate === todayStr && isActive;
  }).length;
