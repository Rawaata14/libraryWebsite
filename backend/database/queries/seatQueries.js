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

async function getAllSeats() {
  try {
    const getSeatsSQL = "SELECT * FROM seat";
    const seats = await doQuery(getSeatsSQL);
    return { success: true, data: seats };
  } catch (error) {
    console.error("Error in fetching seats:", error);
    return { success: false, message: "Failed to fetch seats" };
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

module.exports = {
  addSeat,
  getAllSeats,
  updateSeat,
};
