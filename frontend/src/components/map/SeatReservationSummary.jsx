/*
=========================================================
SeatReservationSummary.jsx

תיאור הקובץ:
חלון המציג את סיכום בחירת המקום לפני יצירת ההזמנה.

הקומפוננטה אחראית על:
- הצגת מספר הכיסא, האזור, התאריך והשעה.
- אישור ההזמנה.
- ביטול הבחירה ובחירת כיסא אחר.
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
חלון ההזמנה.
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
מציגה חלון אישור לאחר בחירת כיסא פנוי במפה.
---------------------------------------------------------
*/
export default function SeatReservationSummary({
  selectedSeat,
  selectedDate,
  selectedTime,
  isSubmitting,
  onConfirm,
  onClose,
}) {
  const dialogRef = useRef(null);
  const previousFocusedElementRef = useRef(null);

  /*
  -------------------------------------------------------
  ניהול מיקוד ומקלדת

  תפקיד:
  מעביר את המיקוד לחלון, סוגר אותו באמצעות Escape
  ושומר את המיקוד בתוך החלון בזמן שהוא פתוח.
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
  סוגרת את החלון רק כאשר לוחצים על הרקע שמחוץ אליו.
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
              Reserve Seat {selectedSeat.id}
            </h2>
          </div>

          <button
            type="button"
            className="seatReservationCloseButton"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close reservation window"
          >
            ×
          </button>
        </div>

        <p
          id="seat-reservation-description"
          className="seatReservationDescription"
        >
          Review the reservation details before confirming.
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

        <div className="mapAvailabilityBanner availableBanner">Available</div>

        <div className="mapSummaryButtonRow">
          <Button
            variant="primary"
            className="confirmSeatReservationButton"
            onClick={onConfirm}
            disabled={isSubmitting || !selectedTime}
          >
            {isSubmitting ? "Confirming..." : "Confirm Reservation"}
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
מגדיר את פרטי הבחירה ואת פעולות חלון ההזמנה.
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
  isSubmitting: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
