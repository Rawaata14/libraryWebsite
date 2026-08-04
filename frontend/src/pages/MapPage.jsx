/*
  MapPage.jsx
  -----------
  דף מפת המקומות הראשי של המערכת (תצוגת סטודנט/אורח).
*/

import { useState } from "react";
import PageShell from "../components/layout/PageShell";
import PageBanner from "../components/layout/PageBanner";
import Button from "../components/common/Button";
import RoomMap from "../components/dashboard/RoomMap";
import axios from "axios"; // 💡 תוקן: נוסף הייבוא החסר של axios
// import { useContext } from "react";
// import { AuthContext } from "../context/AuthContext";

const availableTimeSlots = [
  "08:00 - 10:00",
  "10:00 - 12:00",
  "12:00 - 14:00",
  "14:00 - 16:00",
  "16:00 - 18:00",
];

const getAreaLabel = (location) => {
  if (location === "quiet-room") return "Quiet Room";
  if (location === "computer-area") return "Computer Area";
  if (location === "group-room") return "Group Study Rooms";
  if (location === "reading-nook") return "Reading Nook";
  if (location?.startsWith("study-room")) return "Private Study Room";
  return "-";
};

const getSuggestedUse = (location) => {
  if (location === "quiet-room") return "Quiet individual study";
  if (location === "computer-area") return "Computer-based work";
  if (location === "group-room" || location?.startsWith("study-room"))
    return "Group / study room use";
  if (location === "reading-nook") return "Leisure reading & study";
  return "-";
};

export default function MapPage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  ); // תאריך ברירת מחדל: היום
  const [selectedTime, setSelectedTime] = useState(availableTimeSlots[0]); // זמן ברירת מחדל: הסלוט הראשון
  const [selectedSeat, setSelectedSeat] = useState(null);

  // const { user } = useContext(AuthContext);
  const storedUser = localStorage.getItem("libraryUser");
  const user = storedUser ? JSON.parse(storedUser) : null; // 💡 קריאה ישירה מ-localStorage במקום שימוש בקונטקסט
  // const user = JSON.parse(localStorage.getItem("libraryUser")); // 💡 קריאה ישירה מ-localStorage במקום שימוש בקונטקסט

  const handleConfirmReservation = async () => {
    if (!user) {
      alert("User not logged in. Please log in to reserve a seat.");
      window.location.href = "/login"; // ניתוב לדף ההתחברות
      return;
    }
    console.log("Confirming reservation for seat:", selectedSeat);
    if (!selectedSeat) {
      alert("יש לבחור כיסא לפני אישור ההזמנה");
      return;
    }

    if (selectedSeat.status !== "available") {
      alert("הכיסא הנבחר אינו פנוי להזמנה");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8000/reservations/reserve-seat",
        {
          userId: user.userId || user.id, // 💡 בטיחות: תומך גם ב-userId וגם ב-id
          seatId: selectedSeat.id,
          date: selectedDate,
          startTime: selectedTime.split(" - ")[0],
          endTime: selectedTime.split(" - ")[1],
        },
        { withCredentials: true },
      );

      if (response.status === 200 || response.status === 201) {
        alert(
          `ההזמנה אושרה עבור כיסא שמספרו: ${selectedSeat.id}\nתאריך: ${selectedDate}\nשעה: ${selectedTime}`,
        );
        selectedSeat.status = "occupied"; // עדכון סטטוס הכיסא ל-"occupied" לאחר אישור ההזמנה
        setSelectedSeat({ ...selectedSeat }); // עדכון הסטייט כדי לגרום לרינדור מחדש
        setSelectedSeat(null); // איפוס הבחירה לאחר הזמנה מוצלחת
      }
    } catch (error) {
      console.error("Error occurred while confirming reservation:", error);
      alert("An error occurred while confirming the reservation.");
    }
  };
  console.log("=== MapPage State ===", selectedSeat);
  console.log("userID:",user ? (user.userId || user.id) : "No user logged in (Guest)");

  return (
    <PageShell userType="guest" userName={user?.name}>
      <PageBanner title="Reserve Study Room" />

      <div className="mapPageContainer">
        <div className="mapPageCard mapPageCardColumn">
          <div className="mapSelectionPanel fullWidthPanel">
            <div className="mapFilters">
              <div className="formGroup">
                <label className="mapFilterLabel">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split("T")[0]}
                  className="mapFilterInput"
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSeat(null); // איפוס הבחירה כשמשנים תאריך
                  }}
                />
              </div>

              <div className="formGroup">
                <label className="mapFilterLabel">Select Time</label>
                <select
                  className="mapFilterInput"
                  value={selectedTime}
                  onChange={(event) => {
                    setSelectedTime(event.target.value);
                    setSelectedSeat(null); // איפוס הבחירה כשמשנים שעה
                  }}
                >
                  {availableTimeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 🔥 תוקן: מעבירים את התאריך והשעה כפרופס כדי שהמפה תתרענן ותציג נתונים נכונים */}
            <RoomMap
              onSeatSelect={setSelectedSeat}
              selectedSeatId={selectedSeat?.id}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
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
