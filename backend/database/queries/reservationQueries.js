const doQuery = require("../query");

// Function to reserve a seat
async function reserveSeat(reservationDetails) {
  const { userId, seatId, reservationDate, startTime, endTime, status } =
    reservationDetails;
  try {
    const insertReservationSQL =
      "INSERT INTO seat_reservation (userId, seatId, reservationDate, startTime, endTime, status) VALUES (?, ?, ?, ?, ?, ?)";
    const result = await doQuery(insertReservationSQL, [
      userId,
      seatId,
      reservationDate,
      startTime,
      endTime,
      status,
    ]);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in reserving seat:", error);
    return { success: false, message: "Failed to reserve seat" };
  }
}

// Function to fetch all reservations (for admin/librarian view)
async function getAllReservations() {
  try {
    const getReservationsSQL = "SELECT * FROM seat_reservation";
    const reservations = await doQuery(getReservationsSQL);
    return { success: true, data: reservations };
  } catch (error) {
    console.error("Error in fetching reservations:", error);
    return { success: false, message: "Failed to fetch reservations" };
  }
}

module.exports = {
  reserveSeat,
  getAllReservations,
};
