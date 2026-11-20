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
const { getConnection } = require("../dbSingleton");
const {
  sendSeatReservationEmail,
  sendSeatCancellationEmail,
  sendSeatWaitingListOfferEmail,
} = require("../../utils/emailService");
const {
  isValidDate,
  isValidTime,
  normalizeDate,
  normalizeTime,
  getLibraryDateTime,
} = require("../../utils/formatters");
const seatWaitingListQueries = require("./waitingListQueries");

const RESERVATION_TIME_SLOTS = [
  "08:00 - 10:00",
  "10:00 - 12:00",
  "12:00 - 14:00",
  "14:00 - 16:00",
  "16:00 - 18:00",
  "18:00 - 20:00",
];

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
בודקת אם קיימת הזמנה פעילה חופפת עבור אותו כיסא.
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
יוצרת הזמנה לאחר אימות הזמן, בדיקת חפיפה לכיסא, 
ובדיקה שהמשתמש עצמו אינו מחזיק בהזמנה חופפת אחרת.
---------------------------------------------------------
*/

async function reserveSeat(reservationDetails) {
  const {
    userId,
    seatId,
    reservationDate,
    startTime,
    endTime,
    status = "occupied",
  } = reservationDetails;

  // 1. אימות תאריך ושעות
  const validation = validateReservationTime(
    reservationDate,
    startTime,
    endTime,
  );

  if (!validation.success) {
    return validation;
  }

  let connection;

  try {
    const pool = await getConnection();
    connection = await pool.getConnection();

    await connection.beginTransaction();

    // 2. נעילת המשתמש למניעת הזמנות חופפות
    const [users] = await connection.query(
      `SELECT userId, email, fullName
       FROM user
       WHERE userId = ?
       FOR UPDATE`,
      [userId],
    );

    if (users.length === 0) {
      const error = new Error("User not found");
      error.conflict = true;
      throw error;
    }

    // 3. נעילת הכיסא המבוקש
    const [seats] = await connection.query(
      `SELECT seatId,type, status
       FROM seat
       WHERE seatId = ?
       FOR UPDATE`,
      [seatId],
    );

    if (seats.length === 0) {
      const error = new Error("Seat not found");
      error.conflict = true;
      throw error;
    }

    if (seats[0].type === "table-4" || seats[0].type === "table-8") {
      const error = new Error(
        "A table cannot be reserved as an individual seat",
      );
      error.conflict = true;
      throw error;
    }

    if (String(seats[0].status).toLowerCase() === "blocked") {
      const error = new Error("This seat is blocked");
      error.conflict = true;
      throw error;
    }

    // 4. בדיקת הזמנות חופפות של המשתמש
    const [userReservations] = await connection.query(
      `SELECT reservationId
       FROM seat_reservation
       WHERE userId = ?
         AND reservationDate = ?
         AND LOWER(status) NOT IN ('cancelled', 'canceled')
         AND startTime < ?
         AND endTime > ?
       LIMIT 1
       FOR UPDATE`,
      [
        userId,
        validation.reservationDate,
        validation.endTime,
        validation.startTime,
      ],
    );

    if (userReservations.length > 0) {
      const error = new Error(
        "You already have an active seat reservation during this time slot.",
      );
      error.conflict = true;
      throw error;
    }

    // 5. בדיקת הזמנות חופפות של הכיסא
    const [seatReservations] = await connection.query(
      `SELECT reservationId
       FROM seat_reservation
       WHERE seatId = ?
         AND reservationDate = ?
         AND LOWER(status) NOT IN ('cancelled', 'canceled')
         AND startTime < ?
         AND endTime > ?
       LIMIT 1
       FOR UPDATE`,
      [
        seatId,
        validation.reservationDate,
        validation.endTime,
        validation.startTime,
      ],
    );

    if (seatReservations.length > 0) {
      const error = new Error(
        "This seat is already reserved during the selected time.",
      );
      error.conflict = true;
      throw error;
    }

    // 6. שמירת ההזמנה
    const [result] = await connection.query(
      `INSERT INTO seat_reservation
        (userId, seatId, reservationDate,
         startTime, endTime, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        seatId,
        validation.reservationDate,
        validation.startTime,
        validation.endTime,
        status,
      ],
    );

    await connection.commit();
    connection.release();
    connection = null;

    // 7. שליחת מייל רק לאחר שמירה מוצלחת
    try {
      await sendSeatReservationEmail(users[0].email, users[0].fullName, {
        reservationDate: validation.reservationDate,
        startTime: validation.startTime,
        endTime: validation.endTime,
        seatId,
      });
    } catch (emailError) {
      console.error("Reservation saved, but email failed:", emailError);
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Reservation rollback failed:", rollbackError);
      }
    }

    console.error("Error in reserving seat:", error);

    return {
      success: false,
      conflict: error.conflict === true,
      message: error.conflict ? error.message : "Failed to reserve seat",
    };
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/*
---------------------------------------------------------
reserveGroupSeats

תפקיד:
שמירת מספר כיסאות של שולחן קבוצתי
ב-Transaction אחת.
---------------------------------------------------------
*/
async function reserveGroupSeats(reservationDetails) {
  const {
    userId,
    tableId,
    seatIds,
    reservationDate,
    startTime,
    endTime,
    status = "occupied",
  } = reservationDetails;

  const validation = validateReservationTime(
    reservationDate,
    startTime,
    endTime,
  );

  if (!validation.success) {
    return validation;
  }

  if (
    !Array.isArray(seatIds) ||
    seatIds.length === 0 ||
    seatIds.length > 8 ||
    new Set(seatIds.map(String)).size !== seatIds.length
  ) {
    return {
      success: false,
      message: "Invalid group seat selection",
    };
  }

  let connection;

  try {
    const pool = await getConnection();
    connection = await pool.getConnection();

    await connection.beginTransaction();

    // נעילת המשתמש כדי לסנכרן הזמנות קבוצתיות שלו
    const [users] = await connection.query(
      "SELECT userId, email, fullName FROM user WHERE userId = ? FOR UPDATE",
      [userId],
    );

    if (users.length === 0) {
      throw new Error("User not found");
    }

    const [tables] = await connection.query(
      `SELECT seatId, type
   FROM seat
   WHERE seatId = ?
   FOR UPDATE`,
      [tableId],
    );

    if (
      tables.length !== 1 ||
      !["table-4", "table-8"].includes(tables[0].type)
    ) {
      const error = new Error("Invalid table");
      error.conflict = true;
      throw error;
    }

    const minSeats = tables[0].type === "table-8" ? 5 : 1;
    const maxSeats = tables[0].type === "table-8" ? 8 : 4;

    if (seatIds.length < minSeats || seatIds.length > maxSeats) {
      const error = new Error(
        `This table requires between ${minSeats} and ${maxSeats} seats`,
      );
      error.conflict = true;
      throw error;
    }

    // נעילת הכיסאות בסדר קבוע
    const orderedSeatIds = [...seatIds].sort((a, b) => Number(a) - Number(b));

    for (const seatId of orderedSeatIds) {
      const [seats] = await connection.query(
        `SELECT seatId, tableId, type, status
        FROM seat
        WHERE seatId = ?
        FOR UPDATE`,
        [seatId],
      );

      if (seats.length !== 1 || String(seats[0].tableId) !== String(tableId)) {
        const error = new Error(
          "A selected seat does not belong to this table",
        );
        error.conflict = true;
        throw error;
      }

      if (seats[0].type !== "seat") {
        const error = new Error(`Seat ${seatId} is not a valid chair`);
        error.conflict = true;
        throw error;
      }

      if (String(seats[0].status).toLowerCase() === "blocked") {
        const error = new Error(`Seat ${seatId} is blocked`);
        error.conflict = true;
        throw error;
      }
    }

    // בדיקת חפיפה של המשתמש פעם אחת
    const [userReservations] = await connection.query(
      `SELECT reservationId
       FROM seat_reservation
       WHERE userId = ?
         AND reservationDate = ?
         AND LOWER(status) NOT IN ('cancelled', 'canceled')
         AND startTime < ?
         AND endTime > ?
       LIMIT 1
       FOR UPDATE`,
      [
        userId,
        validation.reservationDate,
        validation.endTime,
        validation.startTime,
      ],
    );

    if (userReservations.length > 0) {
      const error = new Error(
        "You already have an active reservation during this time",
      );
      error.conflict = true;
      throw error;
    }

    // בדיקה שכל הכיסאות פנויים בחלון הזמן
    for (const seatId of orderedSeatIds) {
      const [overlaps] = await connection.query(
        `SELECT reservationId
         FROM seat_reservation
         WHERE seatId = ?
           AND reservationDate = ?
           AND LOWER(status) NOT IN ('cancelled', 'canceled')
           AND startTime < ?
           AND endTime > ?
         LIMIT 1
         FOR UPDATE`,
        [
          seatId,
          validation.reservationDate,
          validation.endTime,
          validation.startTime,
        ],
      );

      if (overlaps.length > 0) {
        const error = new Error(`Seat ${seatId} is already reserved`);
        error.conflict = true;
        throw error;
      }
    }

    // שמירת כל הכיסאות באותה Transaction
    const reservationIds = [];

    for (const seatId of orderedSeatIds) {
      const [result] = await connection.query(
        `INSERT INTO seat_reservation
          (userId, seatId, reservationDate,
           startTime, endTime, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          seatId,
          validation.reservationDate,
          validation.startTime,
          validation.endTime,
          status,
        ],
      );

      reservationIds.push(result.insertId);
    }

    await connection.commit();
    connection.release();
    connection = null;

    try {
      const emailSent = await sendSeatReservationEmail(
        users[0].email,
        users[0].fullName,
        {
          reservationDate: validation.reservationDate,
          startTime: validation.startTime,
          endTime: validation.endTime,
          tableId,
          seatIds: orderedSeatIds,
        },
      );

      if (!emailSent) {
        console.error(
          "Group reservation saved, but confirmation email was not sent",
        );
      }
    } catch (emailError) {
      console.error("Group reservation saved, but email failed:", emailError);
    }

    return {
      success: true,
      data: {
        reservationIds,
        reservedSeatIds: orderedSeatIds,
      },
    };
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }
    }

    console.error("Group reservation failed:", error);

    return {
      success: false,
      conflict: error.conflict === true,
      message: error.conflict ? error.message : "Failed to reserve group seats",
    };
  } finally {
    if (connection) {
      connection.release();
    }
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
        TIME_FORMAT(
          endTime,
          '%H:%i:%s'
        ) AS endTime,
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

    const users = await doQuery(
      `SELECT email, fullName FROM user WHERE userId = ?`,
      [userId],
    );

    if (users.length > 0) {
      const user = users[0];
      await sendSeatCancellationEmail(
        user.email,
        user.fullName,
        {
          reservationDate,
          startTime: reservationStartTime,
          endTime: normalizeTime(reservation.endTime),
          seatId: reservation.seatId,
        },
        false,
      );
    }
    try {
      const nextUser = await seatWaitingListQueries.getFirstWaitingForSeat(
        reservation.seatId,
        reservationDate,
        reservationStartTime,
        normalizeTime(reservation.endTime),
      );

      if (nextUser) {
        const libraryNow = getLibraryDateTime();
        const offeredAt = libraryNow.dateTimeKey.replace("T", " ");
        const offerExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");

        await seatWaitingListQueries.offerSeatEntry(
          nextUser.queueSeatId,
          offeredAt,
          offerExpiresAt,
        );

        if (nextUser.email) {
          await sendSeatWaitingListOfferEmail(
            nextUser.email,
            nextUser.fullName,
            {
              requestedDate: reservationDate,
              requestedStartTime: reservationStartTime,
              requestedEndTime: normalizeTime(reservation.endTime),
              offerExpiresAt,
            },
          );
        }
      }
    } catch (queueError) {
      console.error(
        "Error processing waiting list after cancellation:",
        queueError,
      );
    }
    return {
      success: true,
      data: {
        reservationId,
        seatId: reservation.seatId,
        reservationDate,
        startTime: reservationStartTime,
        endTime: normalizeTime(reservation.endTime),
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
מאפשרת לספרנית לבצע ביטול חריג בכל שלב,
כולל העברת סיבת ביטול אופציונלית.
---------------------------------------------------------
*/
async function cancelReservationByLibrarian(
  reservationId,
  cancellationReason = "",
) {
  console.log(
    "Received cancellation reason from frontend/route:",
    cancellationReason,
  );
  try {
    const getReservationSQL = `
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

    const users = await doQuery(
      `SELECT email, fullName FROM user WHERE userId = ?`,
      [reservation.userId],
    );

    if (users.length > 0) {
      const user = users[0];
      await sendSeatCancellationEmail(
        user.email,
        user.fullName,
        {
          reservationDate: normalizeDate(reservation.reservationDate),
          startTime: normalizeTime(reservation.startTime),
          endTime: normalizeTime(reservation.endTime),
          seatId: reservation.seatId,
        },
        true,
        cancellationReason, // העברת הסיבה לפונקציית המייל
      );
    }

    try {
      const nextUser = await seatWaitingListQueries.getFirstWaitingForSeat(
        reservation.seatId,
        normalizeDate(reservation.reservationDate),
        normalizeTime(reservation.startTime),
        normalizeTime(reservation.endTime),
      );

      if (nextUser) {
        const libraryNow = getLibraryDateTime();
        const offeredAt = libraryNow.dateTimeKey.replace("T", " ");
        const offerExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");

        await seatWaitingListQueries.offerSeatEntry(
          nextUser.queueSeatId,
          offeredAt,
          offerExpiresAt,
        );

        if (nextUser.email) {
          await sendSeatWaitingListOfferEmail(
            nextUser.email,
            nextUser.fullName,
            {
              requestedDate: normalizeDate(reservation.reservationDate),
              requestedStartTime: normalizeTime(reservation.startTime),
              requestedEndTime: normalizeTime(reservation.endTime),
              offerExpiresAt,
            },
          );
        }
      }
    } catch (queueError) {
      console.error(
        "Error processing waiting list after cancellation:",
        queueError,
      );
    }

    return {
      success: true,
      data: {
        reservationId,
        userId: reservation.userId,
        seatId: reservation.seatId,
        reservationDate: normalizeDate(reservation.reservationDate),
        startTime: normalizeTime(reservation.startTime),
        endTime: normalizeTime(reservation.endTime),
        cancellationReason,
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
שולפת הזמנה אחת לפי המזהה שלה.
---------------------------------------------------------
*/
async function getReservationById(reservationId) {
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
        u.email AS userEmail,
        u.fullName AS userFullName
      FROM seat_reservation AS sr
      LEFT JOIN user AS u
        ON sr.userId = u.userId
      WHERE sr.reservationId = ?
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

/**
 * שולף את כל ההזמנות הפעילות שהשעה שלהן מסתיימת בעוד 15 דקות בדיוק
 */
const getReservationsEndingIn15Minutes = async () => {
  try {
    const sql = `
      SELECT 
        r.reservationId,
        r.userId,
        r.seatId,
        u.email AS userEmail,
        u.fullName
      FROM seat_reservation r
      JOIN user u ON r.userId = u.userId
      WHERE r.status = 'occupied'
        AND r.reservationDate = CURDATE()
        AND TIME_FORMAT(r.endTime, '%H:%i') = TIME_FORMAT(DATE_ADD(NOW(), INTERVAL 15 MINUTE), '%H:%i')
    `;

    const rows = await doQuery(sql);
    return { success: true, data: rows };
  } catch (error) {
    console.error("Error fetching reservations ending soon:", error);
    return { success: false, error: error.message };
  }
};

/*
---------------------------------------------------------
getAllTimeSlotsAvailability

תפקיד:
מחזירה את כל חלונות הזמן העתידיים שעדיין ניתן
לבחור עבור התאריך המבוקש.
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

    const validSlots = RESERVATION_TIME_SLOTS.filter((slot) => {
      const startTime = slot.split(" - ")[0];

      if (date === libraryNow.date && startTime <= libraryNow.time) {
        return false;
      }

      return true;
    });

    return {
      success: true,
      data: validSlots,
    };
  } catch (error) {
    console.error("Error fetching reservation time slots:", error);

    return {
      success: false,
      message: "Failed to fetch reservation time slots",
    };
  }
}

/*
getTodayReservationsCount

תפקיד:
מחזירה את סך כל הזמנות הכיסאות הפעילות להיום (שלא בוטלו).
*/
async function getTodayReservationsCount() {
  const sql = `
    SELECT COUNT(*) AS count
    FROM seat_reservation
    WHERE reservationDate = CURDATE()
      AND LOWER(status) <> 'cancelled'
  `;
  const result = await doQuery(sql);
  return Number(result[0]?.count) || 0;
}

/*
getHourlyReservationsForToday

תפקיד:
מחזירה את כמות ההזמנות המרכזת לפי חלונות זמן להיום.
*/
async function getHourlyReservationsForToday() {
  const sql = `
    SELECT
      TIME_FORMAT(startTime, '%H:%i') AS startTime,
      TIME_FORMAT(endTime, '%H:%i') AS endTime,
      COUNT(*) AS booked
    FROM seat_reservation
    WHERE reservationDate = CURDATE()
      AND LOWER(status) <> 'cancelled'
    GROUP BY startTime, endTime
    ORDER BY startTime ASC
  `;
  return await doQuery(sql);
}

/*
getRecentTodayReservations

תפקיד:
מחזירה את רשימת ההזמנות האחרונות שבוצעו להיום לצורך הצגת פעילות.
*/
async function getRecentTodayReservations() {
  const sql = `
    SELECT
      reservationId,
      seatId,
      startTime,
      endTime,
      status
    FROM seat_reservation
    WHERE reservationDate = CURDATE()
    ORDER BY startTime ASC
    LIMIT 5
  `;
  return await doQuery(sql);
}

module.exports = {
  reserveSeat,
  reserveGroupSeats,
  getAllReservations,
  getReservationsByUser,
  getReservationById,
  cancelReservation,
  cancelReservationByLibrarian,
  getAllTimeSlotsAvailability,
  getReservationsEndingIn15Minutes,
  getRecentTodayReservations,
  getTodayReservationsCount,
  getHourlyReservationsForToday,
};
