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
import Button from "../components/common/Button";
import {
  LoaderCircle,
  TriangleAlert,
  CircleAlert,
  Users,
  ListPlus,
} from "lucide-react";
import { useState } from "react";

/*
---------------------------------------------------------
MapPage

תפקיד:
מחברת בין תהליך ההזמנה ורשימת ההמתנה שב-Hook
לבין מפת המקומות ורכיבי התצוגה.
---------------------------------------------------------
*/
export default function MapPage() {
  const [mapItems, setMapItems] = useState([]);
  const [loadedMap, setLoadedMap] = useState(null);
  const [isMapConnectionError, setIsMapConnectionError] = useState(false);
  const {
    minimumDate,
    selectedDate,
    availableSlots,
    isLoadingSlots,
    slotsLoadError,
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
    handleJoinGeneralWaitingList,
    isTable,
    groupSize,
    setGroupSize,
    items,
  } = useSeatReservation({
    items: mapItems,
    isMapConnectionError,
  });

  const hasValidTimeSlot =
    !isLoadingSlots &&
    !slotsLoadError &&
    Boolean(selectedDate) &&
    Boolean(selectedTime) &&
    availableSlots.includes(selectedTime);

  const isMapCurrent =
    loadedMap !== null &&
    loadedMap.date === selectedDate &&
    loadedMap.time === selectedTime;

  const reservableSeats = (loadedMap?.items || []).filter(
    (item) =>
      ["seat", "single-seat", "computer-seat"].includes(item.type) &&
      String(item.status).toLowerCase() !== "blocked",
  );

  const isLibraryFullyBooked =
    hasValidTimeSlot &&
    isMapCurrent &&
    !isMapConnectionError &&
    reservableSeats.length > 0 &&
    reservableSeats.every((item) =>
      ["occupied", "held"].includes(String(item.status).toLowerCase()),
    );

  const isSaturday =
    Boolean(selectedDate) &&
    new Date(`${selectedDate}T00:00:00Z`).getUTCDay() === 6;

  let slotsMessage = null;

  if (isLoadingSlots) {
    slotsMessage = {
      type: "info",
      message: "Loading available reservation times...",
    };
  } else if (slotsLoadError) {
    slotsMessage = {
      type: "error",
      message:
        "Unable to load reservation times. Please check your connection and try again.",
    };
  } else if (isSaturday) {
    slotsMessage = {
      type: "warning",
      message:
        "The library is closed on Saturdays. Please select another date to make a reservation.",
    };
  } else if (availableSlots.length === 0) {
    slotsMessage = {
      type: "warning",
      message:
        "No reservation time slots available. Please select another date.",
    };
  }

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
          {reservationFeedback && !selectedSeat && (
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
                  disabled={
                    isLoadingSlots ||
                    slotsLoadError ||
                    availableSlots.length === 0
                  }
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
                      {isLoadingSlots
                        ? "Loading available times..."
                        : slotsLoadError
                          ? "Unable to load times"
                          : isSaturday
                            ? "Library closed"
                            : "No available time slots"}
                    </option>
                  )}
                </select>
              </div>
            </div>

            {slotsMessage && (
              <div
                className={`mapSlotsMessage mapSlotsMessage--${slotsMessage.type}`}
                role={slotsMessage.type === "error" ? "alert" : "status"}
                aria-live="polite"
              >
                {slotsMessage.type === "info" && (
                  <LoaderCircle size={20} aria-hidden="true" />
                )}

                {slotsMessage.type === "warning" && (
                  <TriangleAlert size={20} aria-hidden="true" />
                )}

                {slotsMessage.type === "error" && (
                  <CircleAlert size={20} aria-hidden="true" />
                )}

                <span>{slotsMessage.message}</span>
              </div>
            )}

            {isLibraryFullyBooked && (
              <div className="generalWaitingListPanel">
                <div className="generalWaitingListContent">
                  <div className="generalWaitingListIcon">
                    <Users size={26} aria-hidden="true" />
                  </div>

                  <div className="generalWaitingListText">
                    <h3>No Seats Currently Available</h3>

                    <p>
                      All reservable seats are currently occupied or temporarily
                      held for the selected time slot. Join the general waiting
                      list to receive an offer when a seat becomes available.
                    </p>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  className="waitingListButton generalWaitingListButton"
                  disabled={isSubmitting || isMapConnectionError}
                  onClick={handleJoinGeneralWaitingList}
                >
                  {isSubmitting ? (
                    <LoaderCircle
                      size={18}
                      className="generalWaitingListSpinner"
                      aria-hidden="true"
                    />
                  ) : (
                    <ListPlus size={18} aria-hidden="true" />
                  )}

                  {isSubmitting
                    ? "Joining Waiting List..."
                    : "Join General Waiting List"}
                </Button>
              </div>
            )}

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
              onSeatSelect={(seat) => {
                if (!hasValidTimeSlot) return;
                handleSeatSelect(seat);
              }}
              onItemsChange={setMapItems}
              onMapLoaded={setLoadedMap}
              selectedSeatId={selectedSeat?.id || offeredSeatId}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onConnectionErrorChange={setIsMapConnectionError}
              readOnly={!hasValidTimeSlot}
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
      {selectedSeat && hasValidTimeSlot && (
        <SeatReservationSummary
          selectedSeat={selectedSeat}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          isSeatAvailable={isSelectedSeatAvailable}
          isSubmitting={isSubmitting}
          reservationFeedback={reservationFeedback}
          isConnectionError={isMapConnectionError}
          onConfirm={handleConfirmReservation}
          onClose={closeReservationDialog}
          isTable={isTable}
          groupSize={groupSize}
          onGroupSizeChange={setGroupSize}
          items={items}
        />
      )}
    </PageShell>
  );
}
