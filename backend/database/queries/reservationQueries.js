/*
=========================================================
reservationQueries.js

תיאור הקובץ:
שאילתות לניהול הזמנות מקומות בספרייה.

כללי זמן:
- חישובי "היום" ו-"עכשיו" נעשים לפי שעון ישראל.
- לא ניתן ליצור הזמנה בעבר.
- הזמנה להיום חייבת להתחיל בעתיד.
- משתמש יכול לבטל רק לפני שעת ההתחלה.
- ספרנית יכולה לבצע ביטול חריג בכל שלב.
=========================================================
*/

const doQuery = require("../query");

const LIBRARY_TIME_ZONE = "Asia/Jerusalem";

const RESERVATION_TIME_SLOTS = [
  "08:00 - 10:00",
  "10:00 - 12:00",
  "12:00 - 14:00",
  "14:00 - 16:00",
  "16:00 - 18:00",
];

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
מחזירה תאריך בפורמט YYYY-MM-DD.
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
מחזירה שעה בפורמט HH:MM.
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
בודקת שמבנה התאריך תקין ושזהו תאריך אמיתי.
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
בודקת שמבנה השעה תקין.
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

/*
---------------------------------------------------------
validateReservationTime

תפקיד:
מאמתת תאריך, שעות ומונעת הזמנה בעבר.
---------------------------------------------------------
*/
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

  const libraryNow = getLibraryDateTime();

  const reservationStartKey = `${reservationDate}T${normalizedStartTime}`;

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

/*
---------------------------------------------------------
checkReservationOverlap

תפקיד:
בודקת אם קיימת הזמנה פעילה חופפת.
---------------------------------------------------------
*/
async function checkReservationOverlap(
  seatId,
  reservationDate,
  startTime,
  endTime,
) {
  try {
    const sql = `
      SELECT reservationId
      FROM seat_reservation
      WHERE seatId = ?
        AND reservationDate = ?
        AND LOWER(status) NOT IN (
          'cancelled',
          'canceled'
        )
        AND startTime < ?
        AND endTime > ?
      LIMIT 1
    `;

    const reservations = await doQuery(sql, [
      seatId,
      reservationDate,
      endTime,
      startTime,
    ]);

    return {
      success: true,
      hasOverlap: reservations.length > 0,
    };
  } catch (error) {
    console.error("Error while checking reservation overlap:", error);

    return {
      success: false,
      message: "Failed to check reservation availability",
    };
  }
}

/*
---------------------------------------------------------
reserveSeat

תפקיד:
יוצרת הזמנה לאחר אימות הזמן ובדיקת חפיפה.
---------------------------------------------------------
*/
async function reserveSeat(reservationDetails) {
  const { userId, seatId, reservationDate, startTime, endTime, status } =
    reservationDetails;

  try {
    const validation = validateReservationTime(
      reservationDate,
      startTime,
      endTime,
    );

    if (!validation.success) {
      return validation;
    }

    const overlapResult = await checkReservationOverlap(
      seatId,
      validation.reservationDate,
      validation.startTime,
      validation.endTime,
    );

    if (!overlapResult.success) {
      return overlapResult;
    }

    if (overlapResult.hasOverlap) {
      return {
        success: false,
        conflict: true,
        message: "This seat is already reserved during the selected time.",
      };
    }

    const insertSQL = `
      INSERT INTO seat_reservation
        (
          userId,
          seatId,
          reservationDate,
          startTime,
          endTime,
          status
        )
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await doQuery(insertSQL, [
      userId,
      seatId,
      validation.reservationDate,
      validation.startTime,
      validation.endTime,
      status,
    ]);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error in reserving seat:", error);

    return {
      success: false,
      message: "Failed to reserve seat",
    };
  }
}

/*
---------------------------------------------------------
getAllReservations

תפקיד:
מחזירה לספרנית את כל ההזמנות.
DATE_FORMAT מונע המרה אוטומטית של DATE ל-UTC.
---------------------------------------------------------
*/
async function getAllReservations() {
  try {
    const sql = `
      SELECT
        sr.reservationId,
        sr.userId,
        sr.seatId,
        DATE_FORMAT(
          sr.reservationDate,
          '%Y-%m-%d'
        ) AS reservationDate,
        TIME_FORMAT(
          sr.startTime,
          '%H:%i:%s'
        ) AS startTime,
        TIME_FORMAT(
          sr.endTime,
          '%H:%i:%s'
        ) AS endTime,
        sr.status,
        u.fullName,
        u.email,
        u.phone,
        s.location,
        s.type AS seatType
      FROM seat_reservation AS sr
      INNER JOIN user AS u
        ON sr.userId = u.userId
      INNER JOIN seat AS s
        ON sr.seatId = s.seatId
      ORDER BY
        sr.reservationDate DESC,
        sr.startTime DESC
    `;

    const reservations = await doQuery(sql);

    return {
      success: true,
      data: reservations,
    };
  } catch (error) {
    console.error("Error fetching all reservations:", error);

    return {
      success: false,
      message: "Failed to fetch all reservations",
    };
  }
}

/*
---------------------------------------------------------
getReservationsByUser

תפקיד:
מחזירה רק את הזמנות המשתמש המחובר.
---------------------------------------------------------
*/
async function getReservationsByUser(userId) {
  try {
    const sql = `
      SELECT
        reservationId,
        userId,
        seatId,
        DATE_FORMAT(
          reservationDate,
          '%Y-%m-%d'
        ) AS reservationDate,
        TIME_FORMAT(
          startTime,
          '%H:%i:%s'
        ) AS startTime,
        TIME_FORMAT(
          endTime,
          '%H:%i:%s'
        ) AS endTime,
        status
      FROM seat_reservation
      WHERE userId = ?
      ORDER BY
        reservationDate DESC,
        startTime ASC
    `;

    const reservations = await doQuery(sql, [userId]);

    return {
      success: true,
      data: reservations,
    };
  } catch (error) {
    console.error("Error fetching user reservations:", error);

    return {
      success: false,
      message: "Failed to fetch user reservations",
    };
  }
}

/*
---------------------------------------------------------
cancelReservation

תפקיד:
מבטלת הזמנה של משתמש רק אם שעת ההתחלה
עדיין לא הגיעה לפי שעון ישראל.
---------------------------------------------------------
*/
async function cancelReservation(reservationId, userId) {
  try {
    const findSQL = `
      SELECT
        reservationId,
        seatId,
        DATE_FORMAT(
          reservationDate,
          '%Y-%m-%d'
        ) AS reservationDate,
        TIME_FORMAT(
          startTime,
          '%H:%i:%s'
        ) AS startTime,
        status
      FROM seat_reservation
      WHERE reservationId = ?
        AND userId = ?
      LIMIT 1
    `;

    const reservations = await doQuery(findSQL, [reservationId, userId]);

    if (reservations.length === 0) {
      return {
        success: false,
        notFound: true,
        message: "Reservation not found",
      };
    }

    const reservation = reservations[0];

    if (
      ["cancelled", "canceled"].includes(
        String(reservation.status).toLowerCase(),
      )
    ) {
      return {
        success: false,
        alreadyCancelled: true,
        message: "Reservation is already cancelled",
      };
    }

    const reservationDate = normalizeDate(reservation.reservationDate);

    const reservationStartTime = normalizeTime(reservation.startTime);

    const reservationStartKey = `${reservationDate}T${reservationStartTime}`;

    const libraryNow = getLibraryDateTime();

    if (
      !reservationDate ||
      !reservationStartTime ||
      reservationStartKey <= libraryNow.dateTimeKey
    ) {
      return {
        success: false,
        cancellationClosed: true,
        message:
          "This reservation can no longer be cancelled because its start time has arrived",
      };
    }

    const cancelSQL = `
      UPDATE seat_reservation
      SET status = 'cancelled'
      WHERE reservationId = ?
        AND userId = ?
        AND LOWER(status) NOT IN (
          'cancelled',
          'canceled'
        )
    `;

    const result = await doQuery(cancelSQL, [reservationId, userId]);

    if (result.affectedRows === 0) {
      return {
        success: false,
        notFound: true,
        message: "Reservation not found or cannot be cancelled",
      };
    }

    /*
      אין לעדכן כאן את status של הכיסא.

      זמינות הכיסא מחושבת לפי ההזמנות הפעילות
      לתאריך ולשעה, בעוד status בטבלת seat משמש
      גם לחסימה מנהלית של מקום.
    */
    return {
      success: true,
      data: {
        reservationId,
        seatId: reservation.seatId,
        reservationDate,
        startTime: reservationStartTime,
        isToday: reservationDate === libraryNow.date,
      },
    };
  } catch (error) {
    console.error("Error while cancelling reservation:", error);

    return {
      success: false,
      message: "Failed to cancel reservation",
    };
  }
}

/*
---------------------------------------------------------
cancelReservationByLibrarian

תפקיד:
מאפשרת לספרנית לבצע ביטול חריג בכל שלב.
---------------------------------------------------------
*/
async function cancelReservationByLibrarian(reservationId) {
  try {
    const getReservationSQL = `
      SELECT
        reservationId,
        userId,
        seatId,
        status
      FROM seat_reservation
      WHERE reservationId = ?
      LIMIT 1
    `;

    const reservations = await doQuery(getReservationSQL, [reservationId]);

    if (reservations.length === 0) {
      return {
        success: false,
        notFound: true,
        message: "Reservation not found",
      };
    }

    const reservation = reservations[0];

    if (
      ["cancelled", "canceled"].includes(
        String(reservation.status).toLowerCase(),
      )
    ) {
      return {
        success: false,
        alreadyCancelled: true,
        message: "Reservation is already cancelled",
      };
    }

    const cancelSQL = `
      UPDATE seat_reservation
      SET status = 'cancelled'
      WHERE reservationId = ?
        AND LOWER(status) NOT IN (
          'cancelled',
          'canceled'
        )
    `;

    const result = await doQuery(cancelSQL, [reservationId]);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: "Failed to cancel reservation",
      };
    }

    /*
      גם בביטול ספרנית אין לשנות את seat.status,
      כדי לא לבטל בטעות חסימה מנהלית של הכיסא.
    */
    return {
      success: true,
      data: {
        reservationId,
        userId: reservation.userId,
        seatId: reservation.seatId,
      },
    };
  } catch (error) {
    console.error("Error while librarian cancels reservation:", error);

    return {
      success: false,
      message: "Failed to cancel reservation",
    };
  }
}

/*
---------------------------------------------------------
getReservationById

תפקיד:
שולפת הזמנה אחת לפי המזהה.
---------------------------------------------------------
*/
async function getReservationById(reservationId) {
  try {
    const sql = `
      SELECT
        reservationId,
        userId,
        seatId,
        DATE_FORMAT(
          reservationDate,
          '%Y-%m-%d'
        ) AS reservationDate,
        TIME_FORMAT(
          startTime,
          '%H:%i:%s'
        ) AS startTime,
        TIME_FORMAT(
          endTime,
          '%H:%i:%s'
        ) AS endTime,
        status
      FROM seat_reservation
      WHERE reservationId = ?
      LIMIT 1
    `;

    const reservations = await doQuery(sql, [reservationId]);

    if (reservations.length === 0) {
      return {
        success: false,
        notFound: true,
        message: "Reservation not found",
      };
    }

    return {
      success: true,
      data: reservations[0],
    };
  } catch (error) {
    console.error("Error fetching reservation by ID:", error);

    return {
      success: false,
      message: "Failed to fetch reservation",
    };
  }
}

/*
---------------------------------------------------------
getAllTimeSlotsAvailability

תפקיד:
מחזירה את חלונות הזמן שעדיין ניתנים להזמנה
ושבהם קיים לפחות מקום פנוי.
---------------------------------------------------------
*/
async function getAllTimeSlotsAvailability(date) {
  try {
    if (!isValidDate(date)) {
      return {
        success: false,
        invalidDate: true,
        message: "Invalid reservation date",
      };
    }

    const libraryNow = getLibraryDateTime();

    if (date < libraryNow.date) {
      return {
        success: true,
        data: [],
      };
    }

    const totalSeatsResult = await doQuery(`
      SELECT COUNT(*) AS count
      FROM seat
      WHERE LOWER(status) <> 'blocked'
    `);

    const totalSeats = Number(totalSeatsResult[0]?.count) || 0;

    if (totalSeats === 0) {
      return {
        success: true,
        data: [],
      };
    }

    const sql = `
      SELECT
        TIME_FORMAT(
          startTime,
          '%H:%i'
        ) AS startTime,
        seatId
      FROM seat_reservation
      WHERE reservationDate = ?
        AND LOWER(status) NOT IN (
          'cancelled',
          'canceled'
        )
    `;

    const reservations = await doQuery(sql, [date]);

    const validSlots = RESERVATION_TIME_SLOTS.filter((slot) => {
      const startTime = slot.split(" - ")[0];

      if (date === libraryNow.date && startTime <= libraryNow.time) {
        return false;
      }

      const bookedSeats = new Set(
        reservations
          .filter(
            (reservation) => normalizeTime(reservation.startTime) === startTime,
          )
          .map((reservation) => reservation.seatId),
      );

      return bookedSeats.size < totalSeats;
    });

    return {
      success: true,
      data: validSlots,
    };
  } catch (error) {
    console.error("Error fetching available time slots:", error);

    return {
      success: false,
      message: "Failed to fetch available time slots",
    };
  }
}

module.exports = {
  reserveSeat,
  getAllReservations,
  getReservationsByUser,
  getReservationById,
  cancelReservation,
  cancelReservationByLibrarian,
  getAllTimeSlotsAvailability,
};
