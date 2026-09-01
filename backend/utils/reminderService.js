const reservationQueries = require("../database/queries/reservationQueries");
const { sendLibraryEmail } = require("../utils/mailer");

/**
 * בודק ושולח התראות לכל מי שההזמנה שלו מסתיימת בעוד 15 דקות
 */
const checkAndSendExpirationReminders = async () => {
  try {
    const result = await reservationQueries.getReservationsEndingIn15Minutes();

    if (!result.success || !result.data || result.data.length === 0) {
      return;
    }

    for (const reservation of result.data) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: reservation.userEmail,
        subject: "Reminder: Your seat reservation is expiring in 15 minutes",
        text: `Hi ${reservation.fullName},\n\nWe wanted to let you know that your seat reservation (Seat #${reservation.seatId}) at the library will expire in about 15 minutes.\nWe hope to see you again soon,\nThe Library Team.`,
      };

      await sendLibraryEmail(
        reservation.userEmail,
        mailOptions.subject,
        mailOptions.text,
      );
    }
  } catch (error) {
    console.error("Error in checkAndSendExpirationReminders workflow:", error);
  }
};

module.exports = {
  checkAndSendExpirationReminders,
};
