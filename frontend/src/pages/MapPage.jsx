/*
  MapPage.jsx
  -----------
  דף מפת המקומות הראשי של המערכת.

  אחריות:
  - להציג למשתמש את מפת הספרייה
  - לאפשר בחירת תאריך ושעת הזמנה
  - לאפשר בחירת כיסא מהמפה
  - להציג סיכום הזמנה מעודכן לפי הבחירה
*/

import { useState } from "react";
import PageShell from "../components/layout/PageShell";
import PageBanner from "../components/layout/PageBanner";
import Button from "../components/common/Button";
import RoomMap from "../components/dashboard/RoomMap";

const availableDates = ["2026-04-15", "2026-04-16", "2026-04-17", "2026-04-18"];

const availableTimeSlots = [
  "08:00 - 10:00",
  "10:00 - 12:00",
  "12:00 - 14:00",
  "14:00 - 16:00",
  "16:00 - 18:00",
];

const getAreaLabel = (area) => {
  if (area === "reading") return "Reading Room";
  if (area === "computer") return "Computer Area";
  if (area === "study") return "Study Rooms Area";
  return "-";
};

const getSuggestedUse = (area) => {
  if (area === "reading") return "Quiet individual study";
  if (area === "computer") return "Computer-based work";
  if (area === "study") return "Group / study room use";
  return "-";
};

export default function MapPage() {
  const [selectedDate, setSelectedDate] = useState(availableDates[0]);
  const [selectedTime, setSelectedTime] = useState(availableTimeSlots[3]);
  const [selectedSeat, setSelectedSeat] = useState(null);

  const handleConfirmReservation = () => {
    if (!selectedSeat) {
      alert("יש לבחור כיסא לפני אישור ההזמנה");
      return;
    }

    alert(
      `ההזמנה אושרה עבור ${selectedSeat.id}\nתאריך: ${selectedDate}\nשעה: ${selectedTime}`,
    );
  };

  return (
    <PageShell userType="guest">
      <PageBanner title="Reserve Study Room" />

      <div className="mapPageContainer">
        <div className="mapPageCard mapPageCardColumn">
          <div className="mapSelectionPanel fullWidthPanel">
            <div className="mapFilters">
              <div className="formGroup">
                <label className="mapFilterLabel">Select Date</label>
                <select
                  className="mapFilterInput"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                >
                  {availableDates.map((date) => (
                    <option key={date} value={date}>
                      {date}
                    </option>
                  ))}
                </select>
              </div>

              <div className="formGroup">
                <label className="mapFilterLabel">Select Time</label>
                <select
                  className="mapFilterInput"
                  value={selectedTime}
                  onChange={(event) => setSelectedTime(event.target.value)}
                >
                  {availableTimeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <RoomMap
              selectedSeatId={selectedSeat?.id || null}
              onSeatSelect={setSelectedSeat}
              showSelectionInfo={true}
            />
          </div>

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
                <strong>Time:</strong> {selectedTime}
              </p>
              <p>
                <strong>Area:</strong>{" "}
                {selectedSeat ? getAreaLabel(selectedSeat.area) : "-"}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {selectedSeat ? selectedSeat.status : "-"}
              </p>
              <p>
                <strong>Suggested Use:</strong>{" "}
                {selectedSeat ? getSuggestedUse(selectedSeat.area) : "-"}
              </p>
            </div>

            <div
              className={
                selectedSeat
                  ? selectedSeat.status === "available"
                    ? "mapAvailabilityBanner availableBanner"
                    : "mapAvailabilityBanner reservedBanner"
                  : "mapAvailabilityBanner reservedBanner"
              }
            >
              {selectedSeat
                ? selectedSeat.status === "available"
                  ? "Available"
                  : "Reserved"
                : "No Selection"}
            </div>

            <div className="mapSummaryButtonRow">
              <Button variant="primary" onClick={handleConfirmReservation}>
                Confirm Reservation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
