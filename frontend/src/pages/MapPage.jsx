/*
  MapPage.jsx
  -----------
  דף מפת המקומות הראשי של המערכת (תצוגת סטודנט/אורח).
*/

import { useState, useEffect } from "react";
import PageShell from "../components/layout/PageShell";
import PageBanner from "../components/layout/PageBanner";
import Button from "../components/common/Button";
import RoomMap from "../components/dashboard/RoomMap";
import axios from "axios";

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
  const [availableSlots, setAvailableSlots] = useState([]); // רשימת השעות הזמינות מהשרת
  const [selectedTime, setSelectedTime] = useState(""); // זמן נבחר
  const [selectedSeat, setSelectedSeat] = useState(null);

  const storedUser = localStorage.getItem("libraryUser");
  const user = storedUser ? JSON.parse(storedUser) : null;

  // פונקציה לשליפת השעות הפנויות מהשרת לפי התאריך הנבחר
  const fetchAvailableSlots = async (date) => {
    try {
      const response = await axios.get(
        "http://localhost:8000/reservations/available-slots",
        {
          params: { date },
          withCredentials: true,
        },
      );
      console.log("Response from server:", response.data);
      const slots = response.data.slots || [];
      setAvailableSlots(slots);

      // אם השעה הנוכחית הנבחרת לא קיימת ברשימה החדשה, נבחר אוטומטית את הראשונה שפנויה
      if (slots.length > 0) {
        if (!slots.includes(selectedTime)) {
          setSelectedTime(slots[0]);
        }
      } else {
        setSelectedTime(""); // אין שעות פנויות בכלל היום
      }
    } catch (error) {
      console.error("Error fetching available slots:", error);
    }
  };

  // שליפת שעות פנויות בעליית הדף ובכל פעם שהתאריך משתנה
  useEffect(() => {
    fetchAvailableSlots(selectedDate);
  }, [selectedDate]);

  const handleConfirmReservation = async () => {
    if (!user) {
      alert("User not logged in. Please log in to reserve a seat.");
      window.location.href = "/login";
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

    if (!selectedTime) {
      alert("יש לבחור שעה תקינה להזמנה");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8000/reservations/reserve-seat",
        {
          userId: user.userId || user.id,
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
        selectedSeat.status = "occupied";
        setSelectedSeat({ ...selectedSeat });
        setSelectedSeat(null);

        // רענון השעות הפנויות לאחר הזמנה מוצלחת (במידה ונסגרו כל המקומות בשעה מסוימת)
        fetchAvailableSlots(selectedDate);
      }
    } catch (error) {
      console.error("Error occurred while confirming reservation:", error);
      alert("An error occurred while confirming the reservation.");
    }
  };

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
                    setSelectedSeat(null);
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
                    setSelectedSeat(null);
                  }}
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
                disabled={
                  !selectedSeat ||
                  selectedSeat.status !== "available" ||
                  !selectedTime
                }
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
