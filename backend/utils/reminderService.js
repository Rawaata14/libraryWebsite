const reservationQueries = require("../database/queries/reservationQueries");
const transporter = require("../utils/mailer");

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
        subject: "תזכורת: הזמנת הכיסא שלך עומדת להסתיים בעוד 15 דקות",
        text: `היי ${reservation.firstName},\n\nרצינו לעדכן שהזמנת הכיסא שלך (כיסא מספר ${reservation.seatId}) בספרייה תסתיים בעוד כ-15 דקות.\nנשמח לראותך שוב,\nצוות הספרייה.`,
      };

      await transporter.sendMail(mailOptions);
    }
  } catch (error) {
    console.error("Error in checkAndSendExpirationReminders workflow:", error);
  }
};

module.exports = {
  checkAndSendExpirationReminders,
};
