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
          <RoomMap showSelectionInfo={true} />

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
