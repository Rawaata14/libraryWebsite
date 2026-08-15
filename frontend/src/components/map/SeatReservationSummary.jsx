/*
=========================================================
SeatReservationSummary.jsx

תיאור הקובץ:
מציג סיכום של בחירת המקום לפני אישור ההזמנה.

הקומפוננטה אחראית על:
- הצגת מספר הכיסא.
- הצגת תאריך ושעה.
- הצגת אזור, סטטוס ושימוש מומלץ.
- הצגת כפתור אישור ההזמנה.
=========================================================
*/

import PropTypes from "prop-types";

import Button from "../common/Button";

import { getMapAreaLabel, getSuggestedMapAreaUse } from "../../utils/mapUtils";

/*
---------------------------------------------------------
SeatReservationSummary

תפקיד:
מציגה את פרטי בחירת המשתמש ומפעילה
את פעולת אישור ההזמנה.
---------------------------------------------------------
*/
export default function SeatReservationSummary({
  selectedSeat,
  selectedDate,
  selectedTime,
  onConfirm,
}) {
  const isAvailable = selectedSeat?.status === "available";

  return (
    <div className="mapSummaryPanel summaryPanelBelowMap">
      <h2 className="mapSummaryTitle">
        {selectedSeat
          ? `Selected Seat: ${selectedSeat.id}`
          : "No Seat Selected"}
      </h2>

      <div className="mapSummaryInfo">
        <p>
          <strong>Date:</strong> {selectedDate}
        </p>

        <p>
          <strong>Time:</strong> {selectedTime || "-"}
        </p>

        <p>
          <strong>Area:</strong>{" "}
          {selectedSeat ? getMapAreaLabel(selectedSeat.location) : "-"}
        </p>

        <p>
          <strong>Status:</strong> {selectedSeat ? selectedSeat.status : "-"}
        </p>

        <p>
          <strong>Suggested Use:</strong>{" "}
          {selectedSeat ? getSuggestedMapAreaUse(selectedSeat.location) : "-"}
        </p>
      </div>

      <div
        className={
          isAvailable
            ? "mapAvailabilityBanner availableBanner"
            : "mapAvailabilityBanner reservedBanner"
        }
      >
        {selectedSeat
          ? isAvailable
            ? "Available"
            : "Reserved"
          : "No Selection"}
      </div>

      <div className="mapSummaryButtonRow">
        <Button
          variant="primary"
          onClick={onConfirm}
          disabled={!selectedSeat || !isAvailable || !selectedTime}
        >
          Confirm Reservation
        </Button>
      </div>
    </div>
  );
}

/*
---------------------------------------------------------
SeatReservationSummary.propTypes

תפקיד:
מגדיר את בחירת הכיסא, פרטי המועד
ופעולת אישור ההזמנה.
---------------------------------------------------------
*/
SeatReservationSummary.propTypes = {
  selectedSeat: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    status: PropTypes.string.isRequired,
    location: PropTypes.string,
  }),
  selectedDate: PropTypes.string.isRequired,
  selectedTime: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
};
