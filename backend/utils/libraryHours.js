/*
=========================================================
libraryHours.js

הגדרה מרכזית של שעות פעילות הספרייה
וחלונות הזמן המותרים להזמנת מקומות ישיבה.
=========================================================
*/
const {
  isValidDate,
  isValidTime,
  normalizeTime,
  getLibraryDateTime,
} = require("./formatters");

const LIBRARY_OPENING_HOURS = {
  0: { open: "08:00", close: "20:00" }, // Sunday
  1: { open: "08:00", close: "20:00" }, // Monday
  2: { open: "08:00", close: "20:00" }, // Tuesday
  3: { open: "08:00", close: "20:00" }, // Wednesday
  4: { open: "08:00", close: "20:00" }, // Thursday
  5: { open: "08:00", close: "13:00" }, // Friday
  6: null, // Saturday
};

const RESERVATION_SLOT_MINUTES = 120;

// המרת שעה למספר דקות
function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// המרת דקות לשעה בפורמט HH:mm
function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

// קבלת שעות הפעילות לפי תאריך
function getOpeningHours(date) {
  const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();

  return LIBRARY_OPENING_HOURS[dayOfWeek] ?? null;
}

// יצירת חלונות הזמנה לפי שעות הפעילות
function getReservationTimeSlots(date) {
  const openingHours = getOpeningHours(date);

  if (!openingHours) {
    return [];
  }

  const openingMinutes = timeToMinutes(openingHours.open);
  const closingMinutes = timeToMinutes(openingHours.close);

  const slots = [];

  for (
    let start = openingMinutes;
    start < closingMinutes;
    start += RESERVATION_SLOT_MINUTES
  ) {
    const end = Math.min(start + RESERVATION_SLOT_MINUTES, closingMinutes);

    slots.push(`${minutesToTime(start)} - ${minutesToTime(end)}`);
  }

  return slots;
}

// בדיקה האם טווח השעות תואם לחלון הזמנה מותר
function isValidReservationSlot(date, startTime, endTime) {
  const slots = getReservationTimeSlots(date);

  return slots.some((slot) => {
    const [allowedStart, allowedEnd] = slot.split(" - ");

    return (
      (startTime === allowedStart || startTime === `${allowedStart}:00`) &&
      (endTime === allowedEnd || endTime === `${allowedEnd}:00`)
    );
  });
}

// אימות תאריך ושעות ההזמנה בהתאם לכללי הספרייה
function validateReservationTime(reservationDate, startTime, endTime) {
  if (
    !isValidDate(reservationDate) ||
    !isValidTime(startTime) ||
    !isValidTime(endTime)
  ) {
    return {
      success: false,
      invalidReservation: true,
      message: "Invalid reservation date or time",
    };
  }

  const normalizedStartTime = normalizeTime(startTime);
  const normalizedEndTime = normalizeTime(endTime);

  if (normalizedStartTime >= normalizedEndTime) {
    return {
      success: false,
      invalidReservation: true,
      message: "Start time must be earlier than end time",
    };
  }

  // בדיקה שהספרייה פתוחה בתאריך המבוקש
  const openingHours = getOpeningHours(reservationDate);

  if (!openingHours) {
    return {
      success: false,
      invalidReservation: true,
      message: "The library is closed on the selected date",
    };
  }

  // בדיקה שההזמנה תואמת לחלון זמן מורשה
  const isAllowedSlot = isValidReservationSlot(
    reservationDate,
    normalizedStartTime,
    normalizedEndTime,
  );

  if (!isAllowedSlot) {
    return {
      success: false,
      invalidReservation: true,
      message:
        `Invalid reservation time slot. Library opening hours: ` +
        `${openingHours.open} - ${openingHours.close}`,
    };
  }

  // מניעת הזמנות בעבר
  const libraryNow = getLibraryDateTime();

  const reservationStartKey = `${reservationDate}T${normalizedStartTime.slice(0, 5)}`;

  if (reservationStartKey <= libraryNow.dateTimeKey) {
    return {
      success: false,
      invalidReservation: true,
      message: "The reservation must start later than the current time",
    };
  }

  return {
    success: true,
    reservationDate,
    startTime: normalizedStartTime,
    endTime: normalizedEndTime,
  };
}

module.exports = {
  LIBRARY_OPENING_HOURS,
  getOpeningHours,
  getReservationTimeSlots,
  isValidReservationSlot,
  validateReservationTime,
};
