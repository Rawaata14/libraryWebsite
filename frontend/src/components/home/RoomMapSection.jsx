/*
  RoomMapSection.jsx
  ------------------
  אזור מפת המקומות בדף הבית.

  אחריות:
  - להציג תקציר ויזואלי של מפת המקומות
  - לאפשר מעבר לדף המפה המלא
*/

import { useNavigate } from "react-router-dom";
import RoomMap from "../dashboard/RoomMap";
import Button from "../common/Button";

export default function RoomMapSection() {
  const navigate = useNavigate();

  return (
    <section className="homeSection">
      <div className="sectionCard">
        <div className="sectionCardHeader">Study Rooms Map</div>

        <div className="sectionCardBody mapSectionBody">
          <RoomMap showSelectionInfo={true} />

          <div className="mapButtonBottom">
            <Button variant="primary" onClick={() => navigate("/map")}>
              View Full Map
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
