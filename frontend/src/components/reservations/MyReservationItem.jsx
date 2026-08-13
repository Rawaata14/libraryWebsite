/*
=========================================================
MyReservationItem.jsx

תיאור הקובץ:
מציג כרטיס של הזמנה אחת בדף הזמנות המשתמש.

הקומפוננטה אחראית על:
- הצגת מספר הכיסא.
- הצגת תאריך ושעות ההזמנה.
- הצגת סטטוס ההזמנה.
- הצגת כפתור ביטול כאשר ההזמנה ניתנת לביטול.
=========================================================
*/

import PropTypes from "prop-types";

import { reservationPropType } from "../../propTypes/reservationPropTypes";

import {
  formatReservationDate,
  formatReservationTime,
  getStatusClass,
  getStatusLabel,
} from "../../utils/reservationUtils";

/*
---------------------------------------------------------
MyReservationItem

תפקיד:
מציגה את פרטי ההזמנה ומעבירה את פעולת הביטול
לקומפוננטה המנהלת.
---------------------------------------------------------
*/
export default function MyReservationItem({
  reservation,
  canCancel,
  isCancelling,
  onCancel,
}) {
  return (
    <article className="myReservationItem">
      <div className="reservationSeatIcon">🪑</div>

      <div className="reservationMainDetails">
        <h3>Seat {reservation.seatId}</h3>

        <div className="reservationDetailsGrid">
          <p>
            <span>Date</span>

            <strong>
              {formatReservationDate(reservation.reservationDate)}
            </strong>
          </p>

          <p>
            <span>Time</span>

            <strong>
              {formatReservationTime(reservation.startTime)} -{" "}
              {formatReservationTime(reservation.endTime)}
            </strong>
          </p>

          <p>
            <span>Reservation ID</span>

            <strong>#{reservation.reservationId}</strong>
          </p>
        </div>
      </div>

      <div className="reservationActionsColumn">
        <span
          className={`myReservationStatus ${getStatusClass(
            reservation.status,
          )}`}
        >
          {getStatusLabel(reservation.status)}
        </span>

        {canCancel && (
          <button
            type="button"
            className="cancelReservationButton"
            disabled={isCancelling}
            onClick={() => onCancel(reservation.reservationId)}
          >
            {isCancelling ? "Cancelling..." : "Cancel Reservation"}
          </button>
        )}
      </div>
    </article>
  );
}

/*
---------------------------------------------------------
MyReservationItem.propTypes

תפקיד:
מגדיר את נתוני ההזמנה ואת פעולת הביטול
שהקומפוננטה מקבלת.
---------------------------------------------------------
*/
MyReservationItem.propTypes = {
  reservation: reservationPropType.isRequired,
  canCancel: PropTypes.bool.isRequired,
  isCancelling: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
};
