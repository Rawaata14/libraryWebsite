/*
=========================================================
ReservationRow.jsx

תיאור הקובץ:
מציג שורה אחת בטבלת ניהול ההזמנות של הספרן.

הקומפוננטה מציגה:
- מזהה ההזמנה.
- פרטי המשתמש.
- פרטי המקום.
- תאריך ושעות ההזמנה.
- סטטוס ההזמנה.
- פעולות שליחת הודעה וביטול.

הקומפוננטה אינה פונה לשרת.
הפעולות מתקבלות דרך props.
=========================================================
*/

import {
  formatReservationDate,
  formatReservationTime,
  formatLocation,
  getStatusLabel,
  getStatusClass,
  isCancelledStatus,
} from "../../utils/reservationUtils";
import PropTypes from "prop-types";
import { reservationPropType } from "../../propTypes/reservationPropTypes";

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

/*
---------------------------------------------------------
ReservationRow.propTypes

תפקיד:
מגדיר את פרטי ההזמנה ואת פעולות הביטול
ושליחת ההודעה הזמינות בכל שורת טבלה.
---------------------------------------------------------
*/
ReservationRow.propTypes = {
  reservation: reservationPropType.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSendMessage: PropTypes.func.isRequired,
};
