/*
=========================================================
seatQueries.js

תיאור הקובץ:
שכבת השאילתות של מערכת הכיסאות והמפה.

אחריות:
- הוספת כיסא חדש למערכת.
- שליפת מצב הכיסאות במפה לפי תאריך וטווח שעות (חישוב דינמי).
- עדכון פרטי כיסא קיים.
- מחיקת כיסא מהמערכת.
- שליפת סטטיסטיקות על כמות הכיסאות החסומים והניתנים להזמנה.
=========================================================
*/

const { doQuery, withTransaction } = require("../query");
const getLibraryDateTime = require("../../utils/formatters").getLibraryDateTime;

const {
  createSeatOfferInTransaction,
  notifySeatOffer,
} = require("../../services/seatWaitingListService");

/*
---------------------------------------------------------
addSeat

תפקיד:
מוסיפה כיסא חדש למסד הנתונים עם ערכי ברירת מחדל
לסטטוס וסוג הכיסא במידת הצורך.
---------------------------------------------------------
*/
async function addSeat(seatDetails) {
  const { location, status, rotation, x, y, type, tableId } = seatDetails;
  const normalizedStatus = status || "available"; // Default status is "available"
  const normalizedType = type || "single-seat"; // Default type is "single-seat"

  try {
    const insertSeatSQL =
      "INSERT INTO seat (location, status, rotation, x, y, type, tableId) VALUES (?, ?, ?, ?, ?, ?, ?)";
    const result = await doQuery(insertSeatSQL, [
      location,
      normalizedStatus,
      rotation,
      x,
      y,
      normalizedType,
      tableId ?? null, // Use null if tableId is undefined
    ]);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in adding seat:", error);
    return { success: false, message: "Failed to add seat" };
  }
}

/*
---------------------------------------------------------
getMapSeatsByTimeSlot

תפקיד:
שולפת את כל הכיסאות ומחשבת את הסטטוס הדינמי שלהם
רק עבור מפת הכיסאות, לפי תאריך וטווח שעות.
---------------------------------------------------------
*/
async function getMapSeatsByTimeSlot(
  reservationDate,
  startTime,
  endTime,
  userId = null,
) {
  try {
    const getMapSQL = `
      SELECT
        s.*,
        CASE
          WHEN s.status = 'blocked' THEN 'blocked'

          WHEN EXISTS (
            SELECT 1
            FROM seat_reservation sr
            WHERE sr.seatId = s.seatId
              AND sr.reservationDate = ?
              AND LOWER(sr.status) NOT IN ('cancelled', 'canceled')
              AND sr.startTime < ?
              AND sr.endTime > ?
          ) THEN 'occupied'

          WHEN EXISTS (
            SELECT 1
            FROM waiting_list_seat wl
            WHERE wl.seatId = s.seatId
              AND wl.requestedDate = ?
              AND wl.requestedStartTime < ?
              AND wl.requestedEndTime > ?
              AND wl.status = 'offered'
              AND wl.offerExpiresAt > ?
              AND (? IS NULL OR wl.userId <> ?)
          ) THEN 'held'

          ELSE 'available'
        END AS status
      FROM seat s
    `;

    const mapSeats = await doQuery(getMapSQL, [
      reservationDate,
      endTime,
      startTime,
      reservationDate,
      endTime,
      startTime,
      getLibraryDateTime().sqlDateTime,
      userId,
      userId,
    ]);

    return { success: true, map: mapSeats };
  } catch (error) {
    console.error("Error fetching map seats by time slot:", error);
    return { success: false, message: "Failed to fetch map seats" };
  }
}

/*
---------------------------------------------------------
updateSeat

תפקיד:
מעדכנת את פרטי הכיסא הקיים (מיקום, סטטוס, זוית, קואורדינטות וסוג).
---------------------------------------------------------
*/
async function updateSeat(seatId, seatDetails) {
  const { location, status, rotation, x, y, type, tableId } = seatDetails;

  const normalizedStatus = status || "available";
  const normalizedType = type || "single-seat";

  try {
    const transactionResult = await withTransaction(async (connection) => {
      // 1. נעילת הכיסא ושליפת הסטטוס הקודם
      const [existingSeats] = await connection.query(
        `SELECT seatId, status
           FROM seat
           WHERE seatId = ?
           FOR UPDATE`,
        [seatId],
      );

      if (existingSeats.length === 0) {
        return {
          success: false,
          message: "Seat not found",
        };
      }

      const previousStatus = String(existingSeats[0].status).toLowerCase();

      // 2. עדכון פרטי הכיסא
      const updateSeatSQL = `
          UPDATE seat
          SET location = ?,
              status = ?,
              rotation = ?,
              x = ?,
              y = ?,
              type = ?,
              tableId = COALESCE(?, tableId)
          WHERE seatId = ?
        `;

      const [result] = await connection.query(updateSeatSQL, [
        location,
        normalizedStatus,
        rotation,
        x,
        y,
        normalizedType,
        seatDetails.tableId === undefined ? null : tableId,
        seatId,
      ]);

      const offers = [];

      // 3. בדיקה האם הוסרה חסימה בפועל
      const wasUnblocked =
        previousStatus === "blocked" &&
        normalizedStatus.toLowerCase() === "available";

      // 4. יצירת הצעות רק לאחר הסרת חסימה
      if (wasUnblocked) {
        const [waitingSlots] = await connection.query(
          `SELECT DISTINCT
               DATE_FORMAT(
                 requestedDate, '%Y-%m-%d'
               ) AS requestedDate,
               TIME_FORMAT(
                 requestedStartTime, '%H:%i:%s'
               ) AS requestedStartTime,
               TIME_FORMAT(
                 requestedEndTime, '%H:%i:%s'
               ) AS requestedEndTime
             FROM waiting_list_seat
             WHERE (seatId IS NULL OR seatId = ?)
               AND status = 'waiting'
             ORDER BY
               requestedDate,
               requestedStartTime,
               requestedEndTime`,
          [seatId],
        );

        for (const slot of waitingSlots) {
          const offer = await createSeatOfferInTransaction(
            connection,
            seatId,
            slot.requestedDate,
            slot.requestedStartTime,
            slot.requestedEndTime,
          );

          if (offer) {
            offers.push(offer);
          }
        }
      }

      return {
        success: true,
        data: result,
        offers,
      };
    });

    if (!transactionResult.success) {
      return transactionResult;
    }

    // 5. שליחת התראות ומיילים לאחר COMMIT
    for (const offer of transactionResult.offers) {
      try {
        await notifySeatOffer(offer);
      } catch (notificationError) {
        console.error(
          "Seat updated, but waiting list notification failed:",
          notificationError,
        );
      }
    }

    return {
      success: true,
      data: transactionResult.data,
    };
  } catch (error) {
    console.error("Error in updating seat:", error);

    return {
      success: false,
      message: "Failed to update seat",
    };
  }
}

/*
---------------------------------------------------------
deleteSeat

תפקיד:
מוחקת כיסא מהמערכת על פי מזהה הכיסא.
---------------------------------------------------------
*/
async function deleteSeat(seatId) {
  try {
    const deleteSeatSQL = "DELETE FROM seat WHERE seatId = ?";
    const result = await doQuery(deleteSeatSQL, [seatId]);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in deleting seat:", error);
    return { success: false, message: "Failed to delete seat" };
  }
}

/*
---------------------------------------------------------
getBlockedSeatsCount

תפקיד:
מחזירה את מספר הכיסאות המוגדרים כחסומים במערכת.
---------------------------------------------------------
*/
async function getBlockedSeatsCount() {
  const sql = `
    SELECT COUNT(*) AS count
    FROM seat
    WHERE LOWER(status) = 'blocked'
  `;
  const result = await doQuery(sql);
  return Number(result[0]?.count) || 0;
}

/*
---------------------------------------------------------
getReservableSeatsCount

תפקיד:
מחזירה את סך כל הכיסאות והעמדות שניתן להזמין בפועל (לא חסומים).
---------------------------------------------------------
*/
async function getReservableSeatsCount() {
  const sql = `
    SELECT COUNT(*) AS count
    FROM seat
    WHERE LOWER(status) <> 'blocked'
      AND type IN (
        'seat',
        'seat-to-add',
        'single-seat',
        'computer-seat'
      )
  `;
  const result = await doQuery(sql);
  return Number(result[0]?.count) || 0;
}

/*
---------------------------------------------------------
ייצוא הפונקציות
---------------------------------------------------------
*/
module.exports = {
  addSeat,
  getMapSeatsByTimeSlot,
  updateSeat,
  deleteSeat,
  getBlockedSeatsCount,
  getReservableSeatsCount,
};
