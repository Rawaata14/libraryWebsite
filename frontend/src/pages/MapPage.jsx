/*
  MapPage.jsx
  -----------
  דף מפת המקומות הראשי של המערכת (תצוגת סטודנט/אורח).
*/

import { useState } from "react";
import PageShell from "../components/layout/PageShell";
import PageBanner from "../components/layout/PageBanner";
import Button from "../components/common/Button";
import RoomMap from "../components/dashboard/RoomMap"; // 💡 מייבאים את העטיפה החכמה

const availableDates = ["2026-04-15", "2026-04-16", "2026-04-17", "2026-04-18"];

const availableTimeSlots = [
  "08:00 - 10:00",
  "10:00 - 12:00",
  "12:00 - 14:00",
  "14:00 - 16:00",
  "16:00 - 18:00",
];

// 💡 תוקן מ-area ל-location כדי להתאים למבנה הנתונים האמיתי של המפה
const getAreaLabel = (location) => {
  if (location === "quiet-room") return "Quiet Room";
  if (location === "computer-area") return "Computer Area";
  if (location === "group-room") return "Group Study Rooms";
  if (location === "reading-nook") return "Reading Nook";
  if (location.startsWith("study-room")) return "Private Study Room";
  return "-";
};

const getSuggestedUse = (location) => {
  if (location === "quiet-room") return "Quiet individual study";
  if (location === "computer-area") return "Computer-based work";
  if (location === "group-room" || location.startsWith("study-room"))
    return "Group / study room use";
  if (location === "reading-nook") return "Leisure reading & study";
  return "-";
};

export default function MapPage() {
  const [selectedDate, setSelectedDate] = useState(availableDates[0]);
  const [selectedTime, setSelectedTime] = useState(availableTimeSlots[3]);
  const [selectedSeat, setSelectedSeat] = useState(null); // יכיל את הנתונים שהמפה מחזירה בלחיצה

  const handleConfirmReservation = () => {
    if (!selectedSeat) {
      alert("יש לבחור כיסא לפני אישור ההזמנה");
      return;
    }

    if (selectedSeat.status !== "available") {
      alert("הכיסא הנבחר אינו פנוי להזמנה");
      return;
    }

    alert(
      `ההזמנה אושרה עבור כיסא שמספרו: ${selectedSeat.id}\nתאריך: ${selectedDate}\nשעה: ${selectedTime}`,
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

            {/* 🔥 משתמשים בעטיפה החכמה! אין יותר useEffect או setItems משוכפלים כאן */}
            <RoomMap
              onSeatSelect={setSelectedSeat}
              selectedSeatId={selectedSeat?.id}
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
              {/* 💡 שימוש ב-location במקום ב-area המושבת */}
              <p>
                <strong>Area:</strong>{" "}
                {selectedSeat ? getAreaLabel(selectedSeat.location) : "-"}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {selectedSeat ? selectedSeat.status : "-"}
              </p>
              <p>
                <strong>Suggested Use:</strong>{" "}
                {selectedSeat ? getSuggestedUse(selectedSeat.location) : "-"}
              </p>
            </div>

            <div
              className={
                selectedSeat && selectedSeat.status === "available"
                  ? "mapAvailabilityBanner availableBanner"
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
              <Button
                variant="primary"
                onClick={handleConfirmReservation}
                disabled={!selectedSeat || selectedSeat.status !== "available"}
              >
                Confirm Reservation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
