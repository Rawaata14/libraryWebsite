const doQuery = require("../query");

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

module.exports = {
  reserveSeat,
};
