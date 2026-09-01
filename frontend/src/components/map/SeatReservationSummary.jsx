/*
=========================================================
SeatReservationSummary.jsx

תיאור הקובץ:
חלון המציג את סיכום בחירת המקום לפני ביצוע
הפעולה.

הקומפוננטה מתאימה לשני מצבים:
- מקום פנוי: אישור הזמנה.
- מקום תפוס: הצטרפות לרשימת המתנה.

אחריות:
- הצגת מספר המקום, האזור, התאריך והשעה.
- הצגת סוג הפעולה.
- אישור הזמנה או הצטרפות לתור.
- ביטול הבחירה ובחירת מקום אחר.
- סגירה באמצעות Escape או לחיצה מחוץ לחלון.
- שמירת המיקוד בתוך החלון לצורכי נגישות.
=========================================================
*/

import { useEffect, useRef } from "react";

import PropTypes from "prop-types";

import Button from "../common/Button";

import { getMapAreaLabel, getSuggestedMapAreaUse } from "../../utils/mapUtils";

/*
---------------------------------------------------------
FOCUSABLE_ELEMENTS_SELECTOR

תפקיד:
מגדיר אילו אלמנטים יכולים לקבל מיקוד בתוך
חלון הפעולה.
---------------------------------------------------------
*/
const FOCUSABLE_ELEMENTS_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/*
---------------------------------------------------------
SeatReservationSummary

תפקיד:
מציגה חלון אישור לאחר בחירת מקום במפה.

isSeatAvailable:
- true: הפעולה היא יצירת הזמנה.
- false: הפעולה היא הצטרפות לרשימת המתנה.
---------------------------------------------------------
*/
export default function SeatReservationSummary({
  selectedSeat,
  selectedDate,
  selectedTime,
  isSeatAvailable,
  isSubmitting,
  onConfirm,
  onClose,
}) {
  const dialogRef = useRef(null);

  const previousFocusedElementRef = useRef(null);

  const actionTitle = isSeatAvailable
    ? `Reserve Seat ${selectedSeat.id}`
    : `Join Waiting List for Seat ${selectedSeat.id}`;

  const actionDescription = isSeatAvailable
    ? "Review the reservation details before confirming."
    : "This seat is occupied for the selected time. Review the details before joining its waiting list.";

  /*
  -------------------------------------------------------
  ניהול מיקוד ומקלדת

  תפקיד:
  מעביר את המיקוד לחלון, סוגר אותו באמצעות
  Escape ושומר את המיקוד בתוך החלון.
  -------------------------------------------------------
  */
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

  /*
  -------------------------------------------------------
  handleOverlayClick

  תפקיד:
  סוגרת את החלון רק כאשר לוחצים על הרקע
  שמחוץ אליו.
  -------------------------------------------------------
  */
  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget && !isSubmitting) {
      onClose();
    }
  };

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
        </div>

        {isSeatAvailable ? (
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
                ? "Confirm Reservation"
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

/*
---------------------------------------------------------
SeatReservationSummary.propTypes

תפקיד:
מגדיר את פרטי הבחירה ואת פעולות חלון האישור.
---------------------------------------------------------
*/
SeatReservationSummary.propTypes = {
  selectedSeat: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,

    status: PropTypes.string.isRequired,

    location: PropTypes.string,
  }).isRequired,

  selectedDate: PropTypes.string.isRequired,

  selectedTime: PropTypes.string.isRequired,

  isSeatAvailable: PropTypes.bool.isRequired,

  isSubmitting: PropTypes.bool.isRequired,

  onConfirm: PropTypes.func.isRequired,

  onClose: PropTypes.func.isRequired,
};
