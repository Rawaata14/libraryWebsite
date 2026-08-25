const doQuery = require("../query");

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
        s.*, -- מחזיר את כל השדות של הכיסא (כולל x, y, width, height וכו')
        CASE 
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
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in updating seat:", error);
    return { success: false, message: "Failed to update seat" };
  }
}

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

module.exports = {
  addSeat,
  getMapSeatsByTimeSlot,
  updateSeat,
  deleteSeat,
};
