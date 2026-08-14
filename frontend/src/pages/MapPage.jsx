/*
=========================================================
MapPage.jsx

תיאור הקובץ:
דף בחירת מקום ויצירת הזמנה במפת הספרייה.

העמוד אחראי על:
- הצגת בחירת התאריך והשעה.
- הצגת מפת המקומות.
- הצגת סיכום המקום שנבחר.

מצב ההזמנה והפעולות מנוהלים באמצעות:
useSeatReservation
=========================================================
*/

import PageShell from "../components/layout/PageShell";
import PageBanner from "../components/layout/PageBanner";
import RoomMap from "../components/dashboard/RoomMap";
import SeatReservationSummary from "../components/map/SeatReservationSummary";

import useSeatReservation from "../hooks/useSeatReservation";

/*
---------------------------------------------------------
MapPage

תפקיד:
מחברת בין תהליך ההזמנה שב-Hook
לבין מפת המקומות ורכיבי התצוגה.
---------------------------------------------------------
*/
export default function MapPage() {
  const {
    minimumDate,
    selectedDate,
    availableSlots,
    selectedTime,
    selectedSeat,
    setSelectedSeat,
    handleDateChange,
    handleTimeChange,
    handleConfirmReservation,
  } = useSeatReservation();

  return (
    <PageShell>
      <PageBanner title="Reserve Study Room" />

      <div className="mapPageContainer">
        <div className="mapPageCard mapPageCardColumn">
          {/*
          =================================================
          בחירת תאריך, שעה ומקום
          =================================================
          */}

          <div className="mapSelectionPanel fullWidthPanel">
            <div className="mapFilters">
              <div className="formGroup">
                <label className="mapFilterLabel" htmlFor="reservation-date">
                  Select Date
                </label>

                <input
                  id="reservation-date"
                  type="date"
                  value={selectedDate}
                  min={minimumDate}
                  className="mapFilterInput"
                  onChange={(event) => handleDateChange(event.target.value)}
                />
              </div>

              <div className="formGroup">
                <label className="mapFilterLabel" htmlFor="reservation-time">
                  Select Time
                </label>

                <select
                  id="reservation-time"
                  className="mapFilterInput"
                  value={selectedTime}
                  onChange={(event) => handleTimeChange(event.target.value)}
                >
                  {availableSlots.length > 0 ? (
                    availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No available slots for this date
                    </option>
                  )}
                </select>
              </div>
            </div>

            <RoomMap
              onSeatSelect={setSelectedSeat}
              selectedSeatId={selectedSeat?.id}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
            />
          </div>

          {/*
          =================================================
          סיכום הבחירה ואישור ההזמנה
          =================================================
          */}

          <SeatReservationSummary
            selectedSeat={selectedSeat}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onConfirm={handleConfirmReservation}
          />
        </div>
      </div>
    </PageShell>
  );
}
