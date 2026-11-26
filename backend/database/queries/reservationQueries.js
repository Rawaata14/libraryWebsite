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

const { doQuery, withTransaction } = require("../query");
const { getConnection } = require("../dbSingleton");
const {
  sendSeatReservationEmail,
  sendSeatCancellationEmail,
} = require("../../utils/emailService");
const {
  isValidDate,
  isValidTime,
  normalizeDate,
  normalizeTime,
  getLibraryDateTime,
} = require("../../utils/formatters");
const {
  getOpeningHours,
  getReservationTimeSlots,
  isValidReservationSlot,
} = require("../../utils/libraryHours");
const {
  createSeatOfferInTransaction,
  notifySeatOffer,
} = require("../../services/seatWaitingListService");
const { completeSeatOffer } = require("./waitingListMaintenanceQueries");

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

  try {
    const transactionResult = await withTransaction(async (connection) => {
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

      // בדיקה האם קיימת הצעה פעילה עבור משתמש אחר
      const [activeOffers] = await connection.query(
        `SELECT queueSeatId
          FROM waiting_list_seat
          WHERE seatId = ?
            AND reservationDate_placeholder = ?
            AND requestedStartTime < ?
            AND requestedEndTime > ?
            AND status = 'offered'
            AND offerExpiresAt > ?
            AND userId <> ?
          LIMIT 1
          FOR UPDATE`.replace("reservationDate_placeholder", "requestedDate"),
        [
          seatId,
          validation.reservationDate,
          validation.endTime,
          validation.startTime,
          getLibraryDateTime().sqlDateTime,
          userId,
        ],
      );

      if (activeOffers.length > 0) {
        const error = new Error(
          "This seat is temporarily held for another user with an active waiting list offer.",
        );
        error.conflict = true;
        throw error;
      }

      // איתור ונעילת הצעה פעילה השייכת למשתמש הנוכחי
      const [ownOffers] = await connection.query(
        `SELECT queueSeatId
   FROM waiting_list_seat
   WHERE seatId = ?
     AND userId = ?
     AND requestedDate = ?
     AND requestedStartTime = ?
     AND requestedEndTime = ?
     AND status = 'offered'
     AND offerExpiresAt > ?
   ORDER BY queueSeatId ASC
   FOR UPDATE`,
        [
          seatId,
          userId,
          validation.reservationDate,
          validation.startTime,
          validation.endTime,
          getLibraryDateTime().sqlDateTime,
        ],
      );

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

      // השלמת ההצעות הפעילות באותה טרנזקציה
      for (const offer of ownOffers) {
        const completionResult = await completeSeatOffer(
          offer.queueSeatId,
          getLibraryDateTime().sqlDateTime,
          connection,
        );

        if (completionResult.affectedRows !== 1) {
          const error = new Error("Failed to complete the waiting list offer.");

          error.conflict = true;
          throw error;
        }
      }

      return {
        result,
        user: users[0],
      };
    });

    const { result, user } = transactionResult;

    // 7. שליחת מייל רק לאחר שמירה מוצלחת
    try {
      await sendSeatReservationEmail(user.email, user.fullName, {
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
    console.error("Error in reserving seat:", error);

    return {
      success: false,
      conflict: error.conflict === true,
      message: error.conflict ? error.message : "Failed to reserve seat",
    };
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

  try {
    const transactionResult = await withTransaction(async (connection) => {
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

        if (
          seats.length !== 1 ||
          String(seats[0].tableId) !== String(tableId)
        ) {
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

      // שמירת ההצעות הפעילות של המשתמש
      const groupOwnOffers = [];

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

        // בדיקת הצעה פעילה עבור משתמש אחר
        const [activeOffers] = await connection.query(
          `SELECT queueSeatId
   FROM waiting_list_seat
   WHERE seatId = ?
     AND requestedDate = ?
     AND requestedStartTime < ?
     AND requestedEndTime > ?
     AND status = 'offered'
     AND offerExpiresAt > ?
     AND userId <> ?
   LIMIT 1
   FOR UPDATE`,
          [
            seatId,
            validation.reservationDate,
            validation.endTime,
            validation.startTime,
            getLibraryDateTime().sqlDateTime,
            userId,
          ],
        );

        if (activeOffers.length > 0) {
          const error = new Error(
            `Seat ${seatId} is temporarily held for another user with an active waiting list offer.`,
          );
          error.conflict = true;
          throw error;
        }
        // איתור ונעילת הצעות המשתמש עבור הכיסא הנוכחי
        const [ownOffers] = await connection.query(
          `SELECT queueSeatId
   FROM waiting_list_seat
   WHERE seatId = ?
     AND userId = ?
     AND requestedDate = ?
     AND requestedStartTime = ?
     AND requestedEndTime = ?
     AND status = 'offered'
     AND offerExpiresAt > ?
   ORDER BY queueSeatId ASC
   FOR UPDATE`,
          [
            seatId,
            userId,
            validation.reservationDate,
            validation.startTime,
            validation.endTime,
            getLibraryDateTime().sqlDateTime,
          ],
        );

        groupOwnOffers.push(...ownOffers);
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

      // השלמת ההצעות הפעילות באותה טרנזקציה
      for (const offer of groupOwnOffers) {
        const completionResult = await completeSeatOffer(
          offer.queueSeatId,
          getLibraryDateTime().sqlDateTime,
          connection,
        );

        if (completionResult.affectedRows !== 1) {
          const error = new Error("Failed to complete the waiting list offer.");

          error.conflict = true;
          throw error;
        }
      }

      return {
        reservationIds,
        orderedSeatIds,
        user: users[0],
      };
    });

    const { reservationIds, orderedSeatIds, user } = transactionResult;

    try {
      const emailSent = await sendSeatReservationEmail(
        user.email,
        user.fullName,
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
    console.error("Group reservation failed:", error);

    return {
      success: false,
      conflict: error.conflict === true,
      message: error.conflict ? error.message : "Failed to reserve group seats",
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
    const transactionResult = await withTransaction(async (connection) => {
      // 1. נעילת המשתמש
      await connection.query(
        `SELECT userId
           FROM user
           WHERE userId = ?
           FOR UPDATE`,
        [userId],
      );

      // 2. איתור הכיסא המשויך להזמנה
      const [initialReservations] = await connection.query(
        `SELECT seatId
           FROM seat_reservation
           WHERE reservationId = ?
             AND userId = ?
           LIMIT 1`,
        [reservationId, userId],
      );

      if (initialReservations.length === 0) {
        return {
          success: false,
          notFound: true,
          message: "Reservation not found",
        };
      }

      const seatId = initialReservations[0].seatId;

      // 3. נעילת הכיסא לפני ביטול ההזמנה
      await connection.query(
        `SELECT seatId
           FROM seat
           WHERE seatId = ?
           FOR UPDATE`,
        [seatId],
      );

      // 4. שליפה ונעילה של ההזמנה
      const [reservations] = await connection.query(
        `SELECT
             reservationId,
             seatId,
             DATE_FORMAT(
               reservationDate, '%Y-%m-%d'
             ) AS reservationDate,
             TIME_FORMAT(
               startTime, '%H:%i:%s'
             ) AS startTime,
             TIME_FORMAT(
               endTime, '%H:%i:%s'
             ) AS endTime,
             status
           FROM seat_reservation
           WHERE reservationId = ?
             AND userId = ?
           LIMIT 1
           FOR UPDATE`,
        [reservationId, userId],
      );

      if (reservations.length === 0) {
        return {
          success: false,
          notFound: true,
          message: "Reservation not found",
        };
      }

      const reservation = reservations[0];

      // 5. בדיקה שההזמנה לא בוטלה בעבר
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

      const reservationEndTime = normalizeTime(reservation.endTime);

      const libraryNow = getLibraryDateTime();

      const reservationStartKey = `${reservationDate}T${reservationStartTime}`;

      // 6. מניעת ביטול לאחר שעת ההתחלה
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

      // 7. ביטול ההזמנה
      const [result] = await connection.query(
        `UPDATE seat_reservation
           SET status = 'cancelled'
           WHERE reservationId = ?
             AND userId = ?
             AND LOWER(status) NOT IN (
               'cancelled', 'canceled'
             )`,
        [reservationId, userId],
      );

      if (result.affectedRows !== 1) {
        throw new Error("Failed to cancel reservation");
      }

      // 8. יצירת הצעה באותה טרנזקציה
      const offer = await createSeatOfferInTransaction(
        connection,
        reservation.seatId,
        reservationDate,
        reservationStartTime,
        reservationEndTime,
      );

      return {
        success: true,
        offer,
        data: {
          reservationId,
          seatId: reservation.seatId,
          reservationDate,
          startTime: reservationStartTime,
          endTime: reservationEndTime,
          isToday: reservationDate === libraryNow.date,
        },
      };
    });

    if (!transactionResult.success) {
      return transactionResult;
    }

    // בשלב זה הטרנזקציה כבר הסתיימה בהצלחה
    const { data, offer } = transactionResult;

    // 9. שליחת התראה לממתין לאחר COMMIT
    if (offer) {
      try {
        await notifySeatOffer(offer);
      } catch (notificationError) {
        console.error(
          "Offer saved, but notification failed:",
          notificationError,
        );
      }
    }

    // 10. שליחת מייל ביטול למשתמש לאחר COMMIT
    try {
      const users = await doQuery(
        `SELECT email, fullName
         FROM user
         WHERE userId = ?`,
        [userId],
      );

      if (users.length > 0) {
        const user = users[0];

        await sendSeatCancellationEmail(
          user.email,
          user.fullName,
          {
            reservationDate: data.reservationDate,
            startTime: data.startTime,
            endTime: data.endTime,
            seatId: data.seatId,
          },
          false,
        );
      }
    } catch (emailError) {
      console.error("Reservation cancelled, but email failed:", emailError);
    }

    return {
      success: true,
      data,
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
  try {
    const transactionResult = await withTransaction(async (connection) => {
      // 1. איתור המשתמש והכיסא המשויכים להזמנה
      const [initialReservations] = await connection.query(
        `SELECT userId, seatId
           FROM seat_reservation
           WHERE reservationId = ?
           LIMIT 1`,
        [reservationId],
      );

      if (initialReservations.length === 0) {
        return {
          success: false,
          notFound: true,
          message: "Reservation not found",
        };
      }

      const { userId, seatId } = initialReservations[0];

      // 2. נעילת המשתמש בעל ההזמנה
      await connection.query(
        `SELECT userId
           FROM user
           WHERE userId = ?
           FOR UPDATE`,
        [userId],
      );

      // 3. נעילת הכיסא
      await connection.query(
        `SELECT seatId
           FROM seat
           WHERE seatId = ?
           FOR UPDATE`,
        [seatId],
      );

      // 4. שליפה ונעילה של ההזמנה
      const [reservations] = await connection.query(
        `SELECT
             reservationId,
             userId,
             seatId,
             DATE_FORMAT(
               reservationDate, '%Y-%m-%d'
             ) AS reservationDate,
             TIME_FORMAT(
               startTime, '%H:%i:%s'
             ) AS startTime,
             TIME_FORMAT(
               endTime, '%H:%i:%s'
             ) AS endTime,
             status
           FROM seat_reservation
           WHERE reservationId = ?
           LIMIT 1
           FOR UPDATE`,
        [reservationId],
      );

      if (reservations.length === 0) {
        return {
          success: false,
          notFound: true,
          message: "Reservation not found",
        };
      }

      const reservation = reservations[0];

      // 5. בדיקה שההזמנה לא בוטלה בעבר
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

      const reservationEndTime = normalizeTime(reservation.endTime);

      // 6. ביטול ההזמנה
      // ספרנית רשאית לבטל גם לאחר שעת ההתחלה
      const [result] = await connection.query(
        `UPDATE seat_reservation
           SET status = 'cancelled'
           WHERE reservationId = ?
             AND LOWER(status) NOT IN (
               'cancelled', 'canceled'
             )`,
        [reservationId],
      );

      if (result.affectedRows !== 1) {
        throw new Error("Failed to cancel reservation");
      }

      // 7. יצירת הצעה לממתין באותה טרנזקציה
      const offer = await createSeatOfferInTransaction(
        connection,
        reservation.seatId,
        reservationDate,
        reservationStartTime,
        reservationEndTime,
      );

      return {
        success: true,
        offer,
        data: {
          reservationId,
          userId: reservation.userId,
          seatId: reservation.seatId,
          reservationDate,
          startTime: reservationStartTime,
          endTime: reservationEndTime,
          cancellationReason,
        },
      };
    });

    if (!transactionResult.success) {
      return transactionResult;
    }

    // הטרנזקציה הסתיימה בהצלחה
    const { data, offer } = transactionResult;

    // 8. שליחת התראה לממתין לאחר COMMIT
    if (offer) {
      try {
        await notifySeatOffer(offer);
      } catch (notificationError) {
        console.error(
          "Offer saved, but notification failed:",
          notificationError,
        );
      }
    }

    // 9. שליחת מייל ביטול לבעל ההזמנה
    try {
      const users = await doQuery(
        `SELECT email, fullName
         FROM user
         WHERE userId = ?`,
        [data.userId],
      );

      if (users.length > 0) {
        const user = users[0];

        await sendSeatCancellationEmail(
          user.email,
          user.fullName,
          {
            reservationDate: data.reservationDate,
            startTime: data.startTime,
            endTime: data.endTime,
            seatId: data.seatId,
          },
          true,
          cancellationReason,
        );
      }
    } catch (emailError) {
      console.error("Reservation cancelled, but email failed:", emailError);
    }

    return {
      success: true,
      data,
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

    // מניעת הצגת חלונות זמן בתאריכים שעברו
    if (date < libraryNow.date) {
      return {
        success: true,
        data: [],
      };
    }

    // קבלת חלונות הזמן בהתאם ליום בשבוע
    const availableSlots = getReservationTimeSlots(date);

    // סינון חלונות זמן ששעת ההתחלה שלהם כבר הגיעה
    const validSlots = availableSlots.filter((slot) => {
      const startTime = slot.split(" - ")[0];

      if (
        date === libraryNow.date &&
        normalizeTime(startTime) <= normalizeTime(libraryNow.time)
      ) {
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
