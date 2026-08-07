/*
=========================================================
ReservationRow.jsx

תיאור הקובץ:
מציג שורה אחת בטבלת ניהול ההזמנות של הספרן.

הקומפוננטה מציגה:
- מזהה הזמנה.
- פרטי המשתמש.
- פרטי המקום.
- תאריך ושעות.
- סטטוס.
- פעולות שליחת הודעה וביטול הזמנה.
=========================================================
*/

import {
  formatReservationDate,
  formatReservationTime,
  formatLocation,
  getStatusLabel,
  getStatusClass,
  isCancelledStatus,
} from "./reservationUtils";

/*
---------------------------------------------------------
ReservationRow

תפקיד:
מקבלת אובייקט הזמנה אחד ומציגה אותו כשורה בטבלה.

הקומפוננטה אינה משנה נתונים ואינה פונה לשרת.
היא רק מפעילה את פונקציות הפעולה שמתקבלות דרך props.
---------------------------------------------------------
*/
export default function ReservationRow({
  reservation,
  onCancel,
  onSendMessage,
}) {
  const isCancelled = isCancelledStatus(reservation.status);

  return (
    <tr>
      <td>
        <strong>#{reservation.reservationId}</strong>
      </td>

      <td>
        <div className="reservationUserDetails">
          <strong>{reservation.fullName || "Unknown User"}</strong>

          <span>{reservation.email || "-"}</span>
        </div>
      </td>

      <td>
        <div className="reservationSeatDetails">
          <strong>Seat {reservation.seatId}</strong>

          <span>{formatLocation(reservation.location)}</span>
        </div>
      </td>

      <td>{formatReservationDate(reservation.reservationDate)}</td>

      <td>
        {formatReservationTime(reservation.startTime)}
        {" - "}
        {formatReservationTime(reservation.endTime)}
      </td>

      <td>
        <span
          className={`managementStatus ${getStatusClass(reservation.status)}`}
        >
          {getStatusLabel(reservation.status)}
        </span>
      </td>

      <td>
        <div className="reservationManagementActions">
          <button
            type="button"
            className="sendReservationMessageButton"
            onClick={() => onSendMessage(reservation)}
          >
            Send Message
          </button>

          {!isCancelled ? (
            <button
              type="button"
              className="librarianCancelButton"
              onClick={() => onCancel(reservation)}
            >
              Cancel
            </button>
          ) : (
            <span className="noActionText">Cancelled</span>
          )}
        </div>
      </td>
    </tr>
  );
}
