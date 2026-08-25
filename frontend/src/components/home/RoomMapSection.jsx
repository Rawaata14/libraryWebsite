/*
  RoomMapSection.jsx
  ------------------
  אזור מפת המקומות בדף הבית.

  אחריות:
  - להציג תקציר ויזואלי של מפת המקומות
  - לאפשר מעבר לדף המפה המלא
*/

import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import RoomMap from "../dashboard/RoomMap";
import Button from "../common/Button";
import { AuthContext } from "../../context/AuthContext";

export default function RoomMapSection() {
  const navigate = useNavigate();
  const { isLibrarian } = useContext(AuthContext); // כאן נוכל להחליף ללוגיקה אמיתית שבודקת אם המשתמש הוא ספרנית

  // 1. חישוב תאריך היום הנוכחי בפורמט YYYY-MM-DD
  const today = new Date().toISOString().split("T")[0];

  // 2. חישוב שעת ברירת מחדל נוכחית (או התאמה לפורמט הטווחים שלך במערכת)
  const currentHour = new Date().getHours();
  // דוגמה לפורמט טווח שעות תואם (למשל השעה הנוכחית עד שעתיים קדימה, או טווח קבוע שרץ כברירת מחדל)
  const currentMinutes = new Date().getMinutes();

  // אפשר להתאים את מחרוזת השעה לפורמט שהמערכת שלך מצפה לו (למשל "08:00 - 10:00")
  // אם תרצי טווח דינמי לפי השעה המדויקת של עכשיו:
  const startTimeStr = `${String(currentHour).padStart(2, "0")}:${currentMinutes < 30 ? "00" : "30"}`;
  const endTimeStr = `${String(currentHour + 2).padStart(2, "0")}:${currentMinutes < 30 ? "00" : "30"}`;
  const defaultTimeSlot = `${startTimeStr} - ${endTimeStr}`;

  const handleMapNavigation = () => {
    if (isLibrarian) {
      navigate("/admin/map"); // ספרנית הולכת לדף הניהול והטולבר
    } else {
      navigate("/map"); // סטודנט או אורח הולכים למפה הרגילה
    }
  };

  return (
    <section className="homeSection">
      <div className="sectionCard">
        <div className="sectionCardHeader">Study Rooms Map</div>

        <div className="sectionCardBody mapSectionBody">
          <RoomMap
            showSelectionInfo={true}
            selectedDate={today}
            selectedTime={defaultTimeSlot}
          />

          <div className="mapButtonBottom">
            <Button variant="primary" onClick={handleMapNavigation}>
              View Full Map
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
