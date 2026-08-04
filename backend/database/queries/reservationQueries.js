const doQuery = require("../query");


/*
---------------------------------------------------------
checkReservationOverlap

תפקיד:
בודקת אם קיימת הזמנה פעילה לאותו כיסא, באותו תאריך,
שטווח השעות שלה חופף לטווח השעות המבוקש.

הערה:
שני טווחים חופפים כאשר:
שעת ההתחלה החדשה קטנה משעת הסיום הקיימת,
ושעת הסיום החדשה גדולה משעת ההתחלה הקיימת.
---------------------------------------------------------
*/
async function checkReservationOverlap(
  seatId,
  reservationDate,
  startTime,
  endTime,
) {
  try {
    const checkOverlapSQL = `
      SELECT reservationId
      FROM seat_reservation
      WHERE seatId = ?
        AND reservationDate = ?
        AND status <> 'cancelled'
        AND startTime < ?
        AND endTime > ?
      LIMIT 1
    `;

    const reservations = await doQuery(checkOverlapSQL, [
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
יוצרת הזמנת מקום חדשה לאחר בדיקה שאין הזמנה חופפת
לאותו כיסא, באותו תאריך ובאותו טווח שעות.
---------------------------------------------------------
*/
async function reserveSeat(reservationDetails) {
  const {
    userId,
    seatId,
    reservationDate,
    startTime,
    endTime,
    status,
  } = reservationDetails;

  try {
    const overlapResult = await checkReservationOverlap(
      seatId,
      reservationDate,
      startTime,
      endTime,
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

    const insertReservationSQL = `
      INSERT INTO seat_reservation
        (userId, seatId, reservationDate, startTime, endTime, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await doQuery(insertReservationSQL, [
      userId,
      seatId,
      reservationDate,
      startTime,
      endTime,
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
מחזירה לספרן את כל הזמנות המקומות במערכת.

הפונקציה מבצעת JOIN בין:
- טבלת הזמנות המקומות.
- טבלת המשתמשים.
- טבלת המקומות.

כך הספרן מקבל גם את שם המשתמש, האימייל
ופרטי האזור של המקום, ולא רק מזהים מספריים.
---------------------------------------------------------
*/
async function getAllReservations() {
  try {
    const getReservationsSQL = `
      SELECT
        sr.reservationId,
        sr.userId,
        sr.seatId,
        sr.reservationDate,
        sr.startTime,
        sr.endTime,
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
        sr.reservationDate ASC,
        sr.startTime ASC
    `;

    const reservations = await doQuery(getReservationsSQL);

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
שליפת כל ההזמנות של המשתמש המחובר בלבד.

קלט:
userId של המשתמש המחובר.

פלט:
מחזיר את כל ההזמנות של המשתמש.
---------------------------------------------------------
*/
async function getReservationsByUser(userId) {
  try {
    const sql = `
      SELECT *
      FROM seat_reservation
      WHERE userId = ?
      ORDER BY reservationDate DESC, startTime ASC
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
מבטלת הזמנת מקום באמצעות שינוי הסטטוס שלה
ל-cancelled.

הפונקציה בודקת שההזמנה שייכת למשתמש שביקש
לבטל אותה, כדי למנוע ממשתמש לבטל הזמנה של משתמש אחר.
---------------------------------------------------------
*/
async function cancelReservation(reservationId, userId) {
  try {
    const cancelReservationSQL = `
      UPDATE seat_reservation
      SET status = 'cancelled'
      WHERE reservationId = ?
        AND userId = ?
        AND status <> 'cancelled'
    `;

    const result = await doQuery(cancelReservationSQL, [
      reservationId,
      userId,
    ]);

    /*
      affectedRows יהיה 0 כאשר:
      - ההזמנה לא קיימת.
      - ההזמנה אינה שייכת למשתמש.
      - ההזמנה כבר בוטלה.
    */
    if (result.affectedRows === 0) {
      return {
        success: false,
        notFound: true,
        message: "Reservation not found or cannot be cancelled",
      };
    }

    return {
      success: true,
      data: result,
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
מאפשרת לספרן לבטל הזמנה במקרה חריג.

בניגוד לביטול של משתמש רגיל,
הספרן אינו מוגבל להזמנות השייכות לחשבון שלו.

הפונקציה:
- מאתרת את ההזמנה לפי reservationId.
- משנה את הסטטוס ל-cancelled.
- מחזירה את userId של בעל ההזמנה,
  לצורך יצירת התראה עבורו.
---------------------------------------------------------
*/
async function cancelReservationByLibrarian(reservationId) {
  try {
    /*
      קודם שולפים את פרטי ההזמנה,
      כדי לדעת לאיזה משתמש לשלוח התראה.
    */
    const getReservationSQL = `
      SELECT reservationId, userId, seatId, status
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

    if (reservation.status === "cancelled") {
      return {
        success: false,
        alreadyCancelled: true,
        message: "Reservation is already cancelled",
      };
    }

    const cancelReservationSQL = `
      UPDATE seat_reservation
      SET status = 'cancelled'
      WHERE reservationId = ?
    `;

    const result = await doQuery(cancelReservationSQL, [reservationId]);

    return {
      success: result.affectedRows > 0,
      data: {
        reservationId,
        userId: reservation.userId,
        seatId: reservation.seatId,
      },
    };
  } catch (error) {
    console.error(
      "Error while librarian cancels reservation:",
      error,
    );

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
שולפת הזמנה אחת לפי reservationId.

השימוש העיקרי:
איתור בעל ההזמנה לפני שליחת הודעה על ידי הספרן.
---------------------------------------------------------
*/
async function getReservationById(reservationId) {
  try {
    const sql = `
      SELECT
        reservationId,
        userId,
        seatId,
        reservationDate,
        startTime,
        endTime,
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

module.exports = {
  reserveSeat,
  getAllReservations,
  getReservationsByUser,
  getReservationById,
  cancelReservation,
  cancelReservationByLibrarian,
};
