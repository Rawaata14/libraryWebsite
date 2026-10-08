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

const doQuery = require("../query");
const seatWaitingListQueries = require("./seatWaitingListQueries");
const sendSeatWaitingListOfferEmail =
  require("../../utils/emailService").sendSeatWaitingListOfferEmail;
const getLibraryDateTime = require("../../utils/formatters").getLibraryDateTime;

/*
---------------------------------------------------------
addSeat

תפקיד:
מוסיפה כיסא חדש למסד הנתונים עם ערכי ברירת מחדל
לסטטוס וסוג הכיסא במידת הצורך.
---------------------------------------------------------
*/
async function addSeat(seatDetails) {
  const { location, status, rotation, x, y, type } = seatDetails;
  const normalizedStatus = status || "available"; // Default status is "available"
  const normalizedType = type || "single-seat"; // Default type is "single-seat"

  try {
    const insertSeatSQL =
      "INSERT INTO seat (location, status, rotation, x, y, type) VALUES (?, ?, ?, ?, ?, ?)";
    const result = await doQuery(insertSeatSQL, [
      location,
      normalizedStatus,
      rotation,
      x,
      y,
      normalizedType,
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
async function getMapSeatsByTimeSlot(reservationDate, startTime, endTime) {
  try {
    const getMapSQL = `
      SELECT
        s.*,
        CASE
          WHEN s.status = 'blocked' THEN 'blocked'
          WHEN sr.reservationId IS NOT NULL THEN 'occupied'
          ELSE 'available'
        END AS status
      FROM seat s
      LEFT JOIN seat_reservation sr
        ON s.seatId = sr.seatId
        AND sr.reservationDate = ?
        AND sr.status <> 'cancelled'
        AND sr.startTime < ?
        AND sr.endTime > ?
    `;

    const mapSeats = await doQuery(getMapSQL, [
      reservationDate,
      endTime,
      startTime,
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
  const { location, status, rotation, x, y, type } = seatDetails;
  const normalizedStatus = status || "available";
  const normalizedType = type || "single-seat";
  try {
    const updateSeatSQL =
      "UPDATE seat SET location = ?, status = ?, rotation = ?, x = ?, y = ?, type = ? WHERE seatId = ?";
    const result = await doQuery(updateSeatSQL, [
      location,
      normalizedStatus,
      rotation,
      x,
      y,
      normalizedType,
      seatId,
    ]);
    if (result.affectedRows === 0) {
      return { success: false, message: "Seat not found" };
    }

    if (normalizedStatus.toLowerCase() === "available") {
      try {
        // 1. שליפת הממתין הראשון ברשימת ההמתנה לכיסא הספציפי הזה
        const findWaitingSQL = `
          SELECT
            waiting.queueSeatId,
            waiting.userId,
            waiting.requestedDate,
            waiting.requestedStartTime,
            waiting.requestedEndTime,
            user.fullName,
            user.email
          FROM waiting_list_seat AS waiting
          INNER JOIN user AS user ON waiting.userId = user.userId
          WHERE (waiting.seatId IS NULL OR waiting.seatId = ?)
            AND waiting.status = 'waiting'
          ORDER BY waiting.createdAt ASC, waiting.queueSeatId ASC
          LIMIT 1
        `;

        const waitingEntries = await doQuery(findWaitingSQL, [seatId]);

        if (waitingEntries.length > 0) {
          const nextUser = waitingEntries[0];

          const libraryNow = getLibraryDateTime(); // ודאי שהפונקציה זמינה בקובץ או ייבאי אותה
          const offeredAt = libraryNow.dateTimeKey.replace("T", " ");
          const offerExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 19)
            .replace("T", " ");

          // 2. עדכון הסטטוס ל-offered
          await seatWaitingListQueries.offerSeatEntry(
            nextUser.queueSeatId,
            offeredAt,
            offerExpiresAt,
          );

          // 3. שליחת מייל למשתמש
          if (nextUser.email) {
            await sendSeatWaitingListOfferEmail(
              nextUser.email,
              nextUser.fullName,
              {
                requestedDate: nextUser.requestedDate,
                requestedStartTime: nextUser.requestedStartTime,
                requestedEndTime: nextUser.requestedEndTime,
                offerExpiresAt,
              },
            );
          }
        }
      } catch (queueError) {
        console.error(
          "Error processing waiting list after seat update:",
          queueError,
        );
      }
    }
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in updating seat:", error);
    return { success: false, message: "Failed to update seat" };
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
