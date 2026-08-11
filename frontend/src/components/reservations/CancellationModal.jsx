/*
=========================================================
CancellationModal.jsx

תיאור הקובץ:
חלון ביטול הזמנה עבור הספרן.

הקומפוננטה מציגה:
- פרטי ההזמנה.
- שם המשתמש.
- מספר הכיסא.
- תאריך ושעות.
- שדה להזנת סיבת הביטול.
- כפתורי אישור וסגירה.

הקומפוננטה אינה מבצעת קריאת API.
פעולת הביטול מתקבלת דרך onConfirm.
=========================================================
*/

import {
  formatReservationDate,
  formatReservationTime,
} from "./reservationUtils";

export default function CancellationModal({
  reservation,
  cancellationReason,
  isCancelling,
  onReasonChange,
  onClose,
  onConfirm,
}) {
  /*
    אם לא נבחרה הזמנה,
    אין צורך להציג את החלון.
  */
  if (!reservation) {
    return null;
  }

  return (
    <div
      className="cancellationModalOverlay"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="cancellationModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancellation-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="cancellationModalHeader">
          <div>
            <h2 id="cancellation-modal-title">Cancel Reservation</h2>

            <p>Reservation #{reservation.reservationId}</p>
          </div>

          <button
            type="button"
            className="closeCancellationModalButton"
            onClick={onClose}
            disabled={isCancelling}
            aria-label="Close cancellation window"
          >
            ×
          </button>
        </div>

        <div className="cancellationReservationInfo">
          <p>
            <span>User</span>

            <strong>{reservation.fullName || "Unknown User"}</strong>
          </p>

          <p>
            <span>Seat</span>

            <strong>Seat {reservation.seatId}</strong>
          </p>

          <p>
            <span>Date</span>

            <strong>
              {formatReservationDate(reservation.reservationDate)}
            </strong>
          </p>

          <p>
            <span>Time</span>

            <strong>
              {formatReservationTime(reservation.startTime)}
              {" - "}
              {formatReservationTime(reservation.endTime)}
            </strong>
          </p>
        </div>

        <label
          className="cancellationReasonField"
          htmlFor="cancellation-reason"
        >
          <span>Cancellation reason</span>

          <textarea
            id="cancellation-reason"
            value={cancellationReason}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder="Explain why the reservation must be cancelled..."
            maxLength={300}
            rows={5}
            disabled={isCancelling}
          />

          <small>{cancellationReason.length}/300 characters</small>
        </label>

        <p className="cancellationWarning">
          The user will receive a notification containing this reason.
        </p>

        <div className="cancellationModalActions">
          <button
            type="button"
            className="keepReservationButton"
            onClick={onClose}
            disabled={isCancelling}
          >
            Keep Reservation
          </button>

          <button
            type="button"
            className="confirmCancellationButton"
            onClick={onConfirm}
            disabled={isCancelling || !cancellationReason.trim()}
          >
            {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
          </button>
        </div>
      </section>
    </div>
  );
}
