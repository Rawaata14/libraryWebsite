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
  const { userId, seatId, reservationDate, startTime, endTime, status } =
    reservationDetails;

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

    const updateSeatStatusSQL = `
      UPDATE seat
      SET status = ?
      WHERE seatId = ?
    `;

    const updateSeatResult = await doQuery(updateSeatStatusSQL, [
      status,
      seatId,
    ]);

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
ל-cancelled, ומשחררת את הכיסא חזרה לפנוי.
---------------------------------------------------------
*/
async function cancelReservation(reservationId, userId) {
  try {
    // 1. קודם כל שולפים את ה-seatId כדי לדעת איזה כיסא לשחרר
    const findSeatSQL = `
      SELECT seatId 
      FROM seat_reservation 
      WHERE reservationId = ? 
        AND userId = ? 
        AND status <> 'cancelled'
    `;
    const reservations = await doQuery(findSeatSQL, [reservationId, userId]);

    if (!reservations || reservations.length === 0) {
      return {
        success: false,
        notFound: true,
        message: "Reservation not found or cannot be cancelled",
      };
    }

    const seatId = reservations[0].seatId;
    
    // 2. עדכון סטטוס ההזמנה ל-'cancelled'
    const cancelReservationSQL = `
      UPDATE seat_reservation
      SET status = 'cancelled'
      WHERE reservationId = ?
        AND userId = ?
    `;

    const result = await doQuery(cancelReservationSQL, [reservationId, userId]);

    if (result.affectedRows === 0) {
      return {
        success: false,
        notFound: true,
        message: "Reservation not found or cannot be cancelled",
      };
    }

    // 3. עדכון סטטוס הכיסא בחזרה ל-'available' (כדי שיהפוך לירוק במפה!)
    const updateSeatStatusSQL = `
      UPDATE seat
      SET status = 'available'
      WHERE seatId = ?
    `;

    await doQuery(updateSeatStatusSQL, [seatId]);

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
מאפשרת לספרן לבטל הזמנה במקרה חריג
ומשחררת את הכיסא חזרה לפנוי.
---------------------------------------------------------
*/
async function cancelReservationByLibrarian(reservationId) {
  try {
    // 1. שולפים את פרטי ההזמנה (כולל seatId ו-userId)
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

    // 2. ביטול ההזמנה
    const cancelReservationSQL = `
      UPDATE seat_reservation
      SET status = 'cancelled'
      WHERE reservationId = ?
    `;

    const result = await doQuery(cancelReservationSQL, [reservationId]);

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: "Failed to cancel reservation",
      };
    }

    // 3. שחרור הכיסא בחזרה לפנוי גם בביטול של ספרן!
    const updateSeatStatusSQL = `
      UPDATE seat
      SET status = 'available'
      WHERE seatId = ?
    `;

    await doQuery(updateSeatStatusSQL, [reservation.seatId]);

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

/*
---------------------------------------------------------
getAllTimeSlotsAvailability

תפקיד:
מקבלת תאריך ומחזירה רשימה של משבצות זמן (Time Slots)
שבהן יש לפחות כיסא אחד פנוי במערכת,
ולא עברו עדיין (אם מדובר בהיום).

כך הסטודנט רואה אך ורק שעות רלוונטיות שניתן להזמין בהן.
---------------------------------------------------------
*/

async function getAllTimeSlotsAvailability(date) {
  try {
    const availableTimeSlots = [
      "08:00 - 10:00",
      "10:00 - 12:00",
      "12:00 - 14:00",
      "14:00 - 16:00",
      "16:00 - 18:00",
    ];

    // 1. ספירת סך כל הכיסאות שקיימים במערכת
    const totalSeatsResult = await doQuery(
      `SELECT COUNT(*) as count FROM seat`,
    );
    const totalSeats = totalSeatsResult[0].count;

    // אם אין כיסאות בכלל במערכת
    if (totalSeats === 0) {
      return { success: true, data: [] };
    }

    // 2. שליפת כל ההזמנות שקיימות באותו תאריך (ושאינן מבוטלות)
    const sql = `
      SELECT startTime, seatId 
      FROM seat_reservation
      WHERE reservationDate = ? 
        AND status <> 'cancelled'
    `;
    const reservations = await doQuery(sql, [date]);

    // 3. זמן נוכחי בשרת לצורך סינון שעות שכבר עברו היום
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    const currentHourMinutes = now.getHours() * 60 + now.getMinutes();

    // 4. סינון השעות
    const validSlots = availableTimeSlots.filter((slot) => {
      const startTimeStr = slot.split(" - ")[0]; // למשל "08:00"

      // א. אם התאריך הנבחר הוא היום - נבדוק אם השעה כבר עברה
      if (date === todayStr) {
        const [hours, minutes] = startTimeStr.split(":").map(Number);
        if (hours * 60 + minutes <= currentHourMinutes) {
          return false; // השעה כבר עברה, לא להציג
        }
      }

      // ב. סופרים כמה כיסאות ייחודיים תפוסים בשעה הספציפית הזו
      const bookedSeatsAtThisTime = new Set(
        reservations
          .filter((res) => res.startTime === startTimeStr)
          .map((res) => res.seatId),
      );

      // ג. אם מספר הכיסאות התפוסים שווה לסך כל הכיסאות -> כולם תפוסים! לא להציג את השעה.
      if (bookedSeatsAtThisTime.size >= totalSeats) {
        return false;
      }

      return true; // יש לפחות מקום אחד פנוי בשעה הזו, השעה תוצג לסטודנט.
    });

    return { success: true, data: validSlots };
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
