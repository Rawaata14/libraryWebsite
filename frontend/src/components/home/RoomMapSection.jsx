/*
=========================================================
RoomMapSection.jsx

תיאור הקובץ:
אזור תצוגה מקדימה של מפת המקומות בדף הבית.

המפה מציגה את מצב המקומות לפי:
- התאריך הנוכחי בישראל.
- חלון הזמן הפעיל כרגע.

אם הספרייה מחוץ לשעות ההזמנה, לא נשלח
חלון זמן מלאכותי שעלול להציג מקומות כתפוסים.
=========================================================
*/

import { useContext } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../common/Button";
import RoomMap from "../dashboard/RoomMap";

import { AuthContext } from "../../context/AuthContext";

import {
  getLibraryDateValue,
  getLibraryTimeValue,
} from "../../utils/libraryDateTime";

/*
---------------------------------------------------------
RESERVATION_TIME_SLOTS

חלונות הזמן שבהם ניתן להזמין מקום.
יש לשמור את הרשימה זהה לזו שבשרת.
---------------------------------------------------------
*/
const RESERVATION_TIME_SLOTS = [
  {
    startTime: "08:00",
    endTime: "10:00",
  },
  {
    startTime: "10:00",
    endTime: "12:00",
  },
  {
    startTime: "12:00",
    endTime: "14:00",
  },
  {
    startTime: "14:00",
    endTime: "16:00",
  },
  {
    startTime: "16:00",
    endTime: "18:00",
  },
];

/*
---------------------------------------------------------
getCurrentReservationTimeSlot

תפקיד:
מחזירה את חלון ההזמנה הפעיל כרגע לפי שעון ישראל.

לדוגמה:
אם השעה 10:35 מוחזר 10:00 - 12:00.
---------------------------------------------------------
*/
const getCurrentReservationTimeSlot = () => {
  const currentTime = getLibraryTimeValue();

  const activeSlot = RESERVATION_TIME_SLOTS.find(
    (slot) => currentTime >= slot.startTime && currentTime < slot.endTime,
  );

  if (!activeSlot) {
    return "";
  }

  return `${activeSlot.startTime} - ${activeSlot.endTime}`;
};

/*
---------------------------------------------------------
RoomMapSection
---------------------------------------------------------
*/
export default function RoomMapSection() {
  const navigate = useNavigate();

  const { isLibrarian } = useContext(AuthContext);

  const today = getLibraryDateValue();

  const currentTimeSlot = getCurrentReservationTimeSlot();

  const handleMapNavigation = () => {
    if (isLibrarian) {
      navigate("/admin/map");
      return;
    }

    navigate("/map");
  };

  return (
    <section className="homeSection">
      <div className="sectionCard">
        <div className="sectionCardHeader">Study Rooms Map</div>

        <div className="sectionCardBody mapSectionBody">
          <RoomMap
            showSelectionInfo={true}
            selectedDate={today}
            selectedTime={currentTimeSlot}
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
