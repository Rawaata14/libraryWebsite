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
  reservationFeedback,
  isConnectionError = false,
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
  const minTableCapacity = selectedSeat?.type === "table-8" ? 5 : 1;

  const maxAvailableGroupSize = Math.min(
    maxTableCapacity,
    availableSeatsForTable.length,
  );
  const canReserveGroup = maxAvailableGroupSize >= minTableCapacity;

  // בדיקת שינוי בזמינות של כיסא יחיד
  const currentSeat = items.find(
    (item) =>
      String(item.id ?? item.seatId) ===
      String(selectedSeat.id ?? selectedSeat.seatId),
  );

  const currentSeatStatus = String(currentSeat?.status || "").toLowerCase();

  const originalSeatStatus = String(selectedSeat?.status || "").toLowerCase();

  const hasSeatStatusChanged =
    !isTable &&
    (!currentSeat ||
      ["held", "blocked"].includes(currentSeatStatus) ||
      currentSeatStatus !== originalSeatStatus);

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
                disabled={isSubmitting || isConnectionError || !canReserveGroup}
                className="groupSizeSelect"
              >
                {Array.from(
                  {
                    length: Math.max(
                      0,
                      maxAvailableGroupSize - minTableCapacity + 1,
                    ),
                  },
                  (_, index) => index + minTableCapacity,
                ).map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? "Person" : "People"}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {isTable ? (
          <div
            className={`mapAvailabilityBanner ${
              canReserveGroup ? "availableBanner" : "waitingListBanner"
            }`}
          >
            {canReserveGroup
              ? `${maxAvailableGroupSize} ${
                  maxAvailableGroupSize === 1 ? "Seat" : "Seats"
                } Available for Group Reservation`
              : maxAvailableGroupSize === 0
                ? "Table Fully Booked — No Seats Available"
                : `Only ${maxAvailableGroupSize} ${
                    maxAvailableGroupSize === 1 ? "Seat" : "Seats"
                  } Available — Group Reservation Unavailable`}
          </div>
        ) : hasSeatStatusChanged ? (
          <div
            className="mapAvailabilityBanner waitingListBanner"
            role="status"
          >
            {currentSeatStatus === "held"
              ? "Temporarily Held — Reserved for a Waiting List User"
              : currentSeatStatus === "blocked"
                ? "This Seat Is Currently Blocked"
                : "Seat Availability Has Changed — Please Select Again"}
          </div>
        ) : isSeatAvailable ? (
          <div className="mapAvailabilityBanner availableBanner">
            Available for Reservation
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

        {isConnectionError && (
          <div
            role="alert"
            style={{
              backgroundColor: "#fff3cd",
              color: "#856404",
              padding: "12px",
              borderRadius: "8px",
              marginTop: "12px",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            Connection lost. Seat availability may be outdated. Please wait for
            the connection to be restored.
          </div>
        )}

        {reservationFeedback && (
          <div
            className={`mapReservationFeedback ${
              reservationFeedback.type === "success"
                ? "mapReservationSuccess"
                : "mapReservationError"
            }`}
            role={reservationFeedback.type === "error" ? "alert" : "status"}
            aria-live="polite"
          >
            {reservationFeedback.message}
          </div>
        )}
        <div className="mapSummaryButtonRow">
          <Button
            variant={isSeatAvailable ? "primary" : "secondary"}
            className={`confirmSeatReservationButton ${
              !isSeatAvailable && !isTable ? "waitingListButton" : ""
            }`}
            onClick={onConfirm}
            disabled={
              isSubmitting ||
              !selectedTime ||
              reservationFeedback?.type === "success" ||
              isConnectionError ||
              hasSeatStatusChanged ||
              (isTable &&
                (!canReserveGroup ||
                  groupSize < minTableCapacity ||
                  groupSize > maxAvailableGroupSize))
            }
          >
            {isSubmitting
              ? isSeatAvailable
                ? "Confirming..."
                : "Joining..."
              : isSeatAvailable
                ? isTable
                  ? `Reserve Table (${groupSize} ${
                      groupSize === 1 ? "Seat" : "Seats"
                    })`
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
  reservationFeedback: PropTypes.shape({
    type: PropTypes.oneOf(["success", "error"]),
    message: PropTypes.string,
  }),
  isConnectionError: PropTypes.bool,
};
