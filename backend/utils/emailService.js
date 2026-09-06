const nodemailer = require("nodemailer");

// הגדרת ה-Transporter המרכזית למערכת
const transporter = nodemailer.createTransport({
  service: "gmail", // או הגדרות ה-SMTP שלך
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/*
---------------------------------------------------------
sendWelcomeEmail

תפקיד:
שולחת מייל ברכה רשמי למשתמש שנרשם לאחרונה למערכת.
---------------------------------------------------------
*/
async function sendWelcomeEmail(userEmail, fullName) {
  try {
    const mailOptions = {
      from: `"Library Management System" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "Welcome to the Library Management System! 📚",
      html: `
        <div dir="ltr" style="font-family: Arial, sans-serif; text-align: left; color: #333;">
          <h2>Hello ${fullName},</h2>
          <p>We are thrilled to have you join our system!</p>
          <p>From now on, you can enjoy a variety of library services: searching for books, reserving study seats, tracking your active loans, and more.</p>
          <br>
          <p>Best regards,</p>
          <p><b>The Library Team</b></p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent successfully to: ${userEmail}`);
    return true;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return false;
  }
}

/*
---------------------------------------------------------
sendSeatReservationEmail

תפקיד:
שולחת אישור הזמנת מקום ישיבה עם פרטי ההזמנה.
---------------------------------------------------------
*/
async function sendSeatReservationEmail(userEmail, fullName, reservation) {
  try {
    const mailOptions = {
      from: `"Library Management System" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "Seat Reservation Confirmation 🪑",
      html: `
        <div dir="ltr" style="font-family: Arial, sans-serif; text-align: left; color: #333;">
          <h2>Hello ${fullName},</h2>
          <p>Your seat has been successfully reserved!</p>
          <p><b>Reservation Details:</b></p>
          <ul>
            <li><b>Date:</b> ${reservation.reservationDate}</li>
            <li><b>Time:</b> ${reservation.startTime} - ${reservation.endTime}</li>
            <li><b>Seat ID / Location:</b> ${reservation.seatId || reservation.location || "N/A"}</li>
          </ul>
          <br>
          <p>Best regards,</p>
          <p><b>The Library Team</b></p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Seat reservation email sent successfully to: ${userEmail}`);
    return true;
  } catch (error) {
    console.error("Error sending seat reservation email:", error);
    return false;
  }
}

/*
---------------------------------------------------------
sendBookLoanEmail

תפקיד:
שולחת אישור השאלת/הזמנת ספר עם פרטי הספר.
---------------------------------------------------------
*/
async function sendBookLoanEmail(userEmail, fullName, bookDetails) {
  try {
    const mailOptions = {
      from: `"Library Management System" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "Book Loan Confirmation 📚",
      html: `
        <div dir="ltr" style="font-family: Arial, sans-serif; text-align: left; color: #333;">
          <h2>Hello ${fullName},</h2>
          <p>You have successfully borrowed a book!</p>
          <p><b>Book Details:</b></p>
          <ul>
            <li><b>Book Title:</b> ${bookDetails.title || bookDetails.bookTitle || "Library Book"}</li>
            <li><b>Due Date:</b> ${bookDetails.dueDate || "Please check your dashboard for return details"}</li>
          </ul>
          <br>
          <p>Best regards,</p>
          <p><b>The Library Team</b></p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Book loan email sent successfully to: ${userEmail}`);
    return true;
  } catch (error) {
    console.error("Error sending book loan email:", error);
    return false;
  }
}

/*
---------------------------------------------------------
sendSeatCancellationEmail

תפקיד:
שולחת הודעת אישור על ביטול הזמנת מקום ישיבה.
---------------------------------------------------------
*/
/*
---------------------------------------------------------
sendSeatCancellationEmail

תפקיד:
שולחת הודעת אישור על ביטול הזמנת מקום ישיבה (מותאם למבטל).
---------------------------------------------------------
*/
async function sendSeatCancellationEmail(
  userEmail,
  fullName,
  reservation,
  cancelledByLibrarian = false,
  cancellationReason = "",
) {
  try {
    const subject = cancelledByLibrarian
      ? "Seat Reservation Cancelled by Librarian ❌"
      : "Seat Reservation Cancellation ❌";

    const messageText = cancelledByLibrarian
      ? "Your seat reservation has been cancelled by the library administration."
      : "Your seat reservation has been successfully cancelled.";

    const mailOptions = {
      from: `"Library Management System" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: subject,
      html: `
        <div dir="ltr" style="font-family: Arial, sans-serif; text-align: left; color: #333;">
          <h2>Hello ${fullName},</h2>
          <p>${messageText}</p>
          <p><b>Cancelled Reservation Details:</b></p>
          <ul>
            <li><b>Date:</b> ${reservation.reservationDate}</li>
            <li><b>Time:</b> ${reservation.startTime} - ${reservation.endTime}</li>
            <li><b>Seat ID:</b> ${reservation.seatId || "N/A"}</li>
          </ul>
          <br>
          <p>Best regards,</p>
          <p><b>The Library Team</b></p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Seat cancellation email sent successfully to: ${userEmail}`);
    return true;
  } catch (error) {
    console.error("Error sending seat cancellation email:", error);
    return false;
  }
}

module.exports = {
  sendWelcomeEmail,
  sendSeatReservationEmail,
  sendBookLoanEmail,
  sendSeatCancellationEmail,
};
