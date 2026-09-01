/*
=========================================================
MapPage.jsx

תיאור הקובץ:
דף בחירת מקום במפת הספרייה.

העמוד אחראי על:
- הצגת בחירת התאריך והשעה.
- הצגת מפת המקומות.
- פתיחת חלון הזמנה עבור מקום פנוי.
- פתיחת חלון הצטרפות לתור עבור מקום תפוס.
- סימון מקום שהוצע למשתמש מרשימת ההמתנה.
- הצגת הודעת הצלחה או שגיאה נגישה.

מצב ההזמנה והפעולות מנוהלים באמצעות:
useSeatReservation
=========================================================
*/

import PageBanner from "../components/layout/PageBanner";

import PageShell from "../components/layout/PageShell";

import RoomMap from "../components/dashboard/RoomMap";

import SeatReservationSummary from "../components/map/SeatReservationSummary";

import useSeatReservation from "../hooks/useSeatReservation";

/*
---------------------------------------------------------
MapPage

תפקיד:
מחברת בין תהליך ההזמנה ורשימת ההמתנה שב-Hook
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
    offeredSeatId,
    isSelectedSeatAvailable,
    isSubmitting,
    mapRefreshKey,
    reservationFeedback,
    handleSeatSelect,
    closeReservationDialog,
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
          הוראות קצרות לתהליך

          מקום פנוי:
          המשתמש מאשר הזמנה.

          מקום תפוס:
          המשתמש מצטרף לרשימת המתנה.

          הצעה פעילה:
          המקום שהוצע למשתמש מסומן במפה.
          =================================================
          */}
          <ol className="reservationSteps" aria-label="Reservation steps">
            <li>
              <span>1</span>
              Select date and time
            </li>

            <li>
              <span>2</span>
              Choose a seat
            </li>

            <li>
              <span>3</span>
              Reserve or join the waiting list
            </li>
          </ol>

          {/*
          =================================================
          הודעת הצלחה או שגיאה
          =================================================
          */}
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
                      No future time slots for this date
                    </option>
                  )}
                </select>
              </div>
            </div>

            {/*
            RoomMap מקבלת את התאריך וטווח הזמן
            ומציגה את מצב המקומות לאותו מועד.

            selectedSeatId:
            - אם המשתמש כבר לחץ על מקום, מסומן
              המקום שנבחר.
            - אם המשתמש הגיע מהצעה פעילה, מסומן
              המקום שהוצע לו עד שילחץ עליו.
            */}
            <RoomMap
              key={mapRefreshKey}
              onSeatSelect={handleSeatSelect}
              selectedSeatId={selectedSeat?.id || offeredSeatId}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
            />
          </div>
        </div>
      </div>

      {/*
      ===================================================
      חלון סיכום ואישור הפעולה

      מקום פנוי:
      החלון מציג אישור הזמנה.

      מקום תפוס:
      החלון מציג אישור הצטרפות לרשימת המתנה.

      מקום חסום אינו ניתן לבחירה ולכן אינו
      פותח את החלון.
      ===================================================
      */}
      {selectedSeat && (
        <SeatReservationSummary
          selectedSeat={selectedSeat}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          isSeatAvailable={isSelectedSeatAvailable}
          isSubmitting={isSubmitting}
          onConfirm={handleConfirmReservation}
          onClose={closeReservationDialog}
        />
      )}
    </PageShell>
  );
}
