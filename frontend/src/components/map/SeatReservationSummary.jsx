/*
=========================================================
SeatReservationSummary.jsx

תיאור הקובץ:
חלון המציג את סיכום בחירת המקום/השולחן לפני ביצוע
הפעולה (כולל תמיכה בהזמנה קבוצתית לשולחן).

הקומפוננטה מתאימה לשני מצבים:
- מקום/שולחן פנוי: אישור הזמנה (רגילה או קבוצתית).
- מקום תפוס: הצטרפות לרשימת המתנה.
=========================================================
*/

import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import Button from "../common/Button";
import { getMapAreaLabel, getSuggestedMapAreaUse } from "../../utils/mapUtils";

const FOCUSABLE_ELEMENTS_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export default function SeatReservationSummary({
  selectedSeat,
  selectedDate,
  selectedTime,
  isSeatAvailable,
  isSubmitting,
  onConfirm,
  onClose,
  isTable = false,
  groupSize = 2,
  onGroupSizeChange,
  items = [],
}) {
  const dialogRef = useRef(null);
  const previousFocusedElementRef = useRef(null);

  const actionTitle = isTable
    ? `Reserve Group Table ${selectedSeat.id}`
    : isSeatAvailable
      ? `Reserve Seat ${selectedSeat.id}`
      : `Join Waiting List for Seat ${selectedSeat.id}`;

  const actionDescription = isTable
    ? "Select group size and review table reservation details before confirming."
    : isSeatAvailable
      ? "Review the reservation details before confirming."
      : "This seat is occupied for the selected time. Review the details before joining its waiting list.";

  useEffect(() => {
    previousFocusedElementRef.current = document.activeElement;
    const dialogElement = dialogRef.current;
    dialogElement?.focus();

    document.body.classList.add("reservationDialogOpen");

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogElement) {
        return;
      }

      const focusableElements = Array.from(
        dialogElement.querySelectorAll(FOCUSABLE_ELEMENTS_SELECTOR),
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogElement.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("reservationDialogOpen");
      previousFocusedElementRef.current?.focus();
    };
  }, [isSubmitting, onClose]);

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  // 💡 חישוב דינמי של הכיסאות הפנויים ששייכים לשולחן הספציפי הזה
  const availableSeatsForTable = items.filter(
    (item) =>
      String(item.tableId) === String(selectedSeat?.id) &&
      String(item.status).toLowerCase() === "available",
  );

  // אם יש מידע על כיסאות השולחן נשתמש בהם, אחרת ניפול לבררת מחדל לפי סוג השולחן
  const maxTableCapacity = selectedSeat?.type === "table-8" ? 8 : 4;

  return (
    <div className="seatReservationOverlay" onMouseDown={handleOverlayClick}>
      <section
        ref={dialogRef}
        className="seatReservationDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="seat-reservation-title"
        aria-describedby="seat-reservation-description"
        tabIndex="-1"
      >
        <div className="seatReservationDialogHeader">
          <div>
            <span className="seatReservationStep">Final step</span>

            <h2 id="seat-reservation-title" className="mapSummaryTitle">
              {actionTitle}
            </h2>
          </div>

          <button
            type="button"
            className="seatReservationCloseButton"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close action window"
          >
            ×
          </button>
        </div>

        <p
          id="seat-reservation-description"
          className="seatReservationDescription"
        >
          {actionDescription}
        </p>

        <div className="mapSummaryInfo">
          <div className="seatReservationDetail">
            <span>Date</span>
            <strong>{selectedDate}</strong>
          </div>

          <div className="seatReservationDetail">
            <span>Time</span>
            <strong>{selectedTime}</strong>
          </div>

          <div className="seatReservationDetail">
            <span>Area</span>
            <strong>{getMapAreaLabel(selectedSeat.location)}</strong>
          </div>

          <div className="seatReservationDetail">
            <span>Suggested use</span>
            <strong>{getSuggestedMapAreaUse(selectedSeat.location)}</strong>
          </div>

          {/* 💡 אלמנט בחירת גודל קבוצה בעת הזמנת שולחן */}
          {isTable && onGroupSizeChange && (
            <div className="seatReservationDetail groupSizeSelectorRow">
              <span>Group Size (People)</span>
              <select
                value={groupSize}
                onChange={(e) => onGroupSizeChange(Number(e.target.value))}
                disabled={isSubmitting || maxTableCapacity === 0}
                className="groupSizeSelect"
              >
                {Array.from(
                  { length: maxTableCapacity },
                  (_, index) => index + 1,
                ).map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? "Person" : "People"}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {isSeatAvailable ? (
          <div className="mapAvailabilityBanner availableBanner">
            {isTable
              ? "Table Available for Group Reservation"
              : "Available for Reservation"}
          </div>
        ) : (
          <>
            <div className="mapAvailabilityBanner waitingListBanner">
              Currently Occupied — Waiting List Available
            </div>

            <p className="seatWaitingListExplanation">
              If this place becomes available, the first user in line will
              receive a notification and a limited-time opportunity to reserve
              it.
            </p>
          </>
        )}

        <div className="mapSummaryButtonRow">
          <Button
            variant={isSeatAvailable ? "primary" : "secondary"}
            className="confirmSeatReservationButton"
            onClick={onConfirm}
            disabled={isSubmitting || !selectedTime}
          >
            {isSubmitting
              ? isSeatAvailable
                ? "Confirming..."
                : "Joining..."
              : isSeatAvailable
                ? isTable
                  ? `Reserve Table (${groupSize} Seats)`
                  : "Confirm Reservation"
                : "Join Waiting List"}
          </Button>

          <Button
            className="chooseAnotherSeatButton"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Choose Another Seat
          </Button>
        </div>
      </section>
    </div>
  );
}

SeatReservationSummary.propTypes = {
  selectedSeat: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    status: PropTypes.string.isRequired,
    location: PropTypes.string,
    type: PropTypes.string,
  }).isRequired,

  selectedDate: PropTypes.string.isRequired,
  selectedTime: PropTypes.string.isRequired,
  isSeatAvailable: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,

  // 💡 propTypes מעודכנים
  isTable: PropTypes.bool,
  groupSize: PropTypes.number,
  onGroupSizeChange: PropTypes.func,
  items: PropTypes.array,
};
