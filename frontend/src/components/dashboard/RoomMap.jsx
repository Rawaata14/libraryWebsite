/*
  RoomMap.jsx
  -----------
  עטיפה חכמה למפת הספרייה.
*/

import { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import LibraryMap from "../map/LibraryMap";
import axios from "axios";

export default function RoomMap({
  selectedSeatId = null,
  onSeatSelect,
  showSelectionInfo = true,
  selectedDate, // 💡 פרופ חדש שנוסף כדי להאזין לשינויי תאריך מהדף הראשי
  selectedTime, // 💡 פרופ חדש שנוסף כדי להאזין לשינויי שעה מהדף הראשי
}) {
  const { isLibrarian } = useContext(AuthContext);
  const location = useLocation();

  // הסטייט הראשי של הרהיטים באפליקציה (Single Source of Truth)
  const [items, setItems] = useState([]);

  const [internalSelectedSeatId, setInternalSelectedSeatId] =
    useState(selectedSeatId);

  const handleSeatSelect = (seatData) => {
    const newId = seatData ? seatData.seatId || seatData.id : null;
    setInternalSelectedSeatId(newId);
    if (onSeatSelect) {
      onSeatSelect(seatData);
    }
  };

  // 💡 פונקציית הטעינה שולחת כעת את התאריך והשעה כפרמטרים לשרת כדי לקבל סטטוס עדכני
  const fetchSeats = async () => {
    try {
      const response = await axios.get("http://localhost:8000/seats/get-map", {
        params: {
          date: selectedDate,
          time: selectedTime,
        },
        withCredentials: true,
      });
      if (response.status === 200) {
        const mapData =
          response.data.map ||
          (Array.isArray(response.data) ? response.data : []);
        setItems(mapData);
      }
    } catch (error) {
      console.error("Error fetching seats inside RoomMap wrapper:", error);
      setItems([]); // במקרה של שגיאה, נעדכן את הסטייט לריק כדי למנוע בעיות ברינדור
    }
  };

  // משיכת הרהיטים המעודכנים בכל פעם שהקומפוננטה נטענת או כשהתאריך/שעה משתנים
  useEffect(() => {
    fetchSeats();
  }, [selectedDate, selectedTime]);

  /* toolbar וניהול יוצגו רק בדף המפה הראשי או בדף המנהל */
  const isMapPage =
    location.pathname === "/map" || location.pathname === "/admin/map";

  return (
    <LibraryMap
      isLibrarian={isLibrarian && isMapPage}
      items={items}
      setItems={setItems}
      fetchLatestSeats={fetchSeats}
      selectedSeatId={internalSelectedSeatId}
      onSeatSelect={handleSeatSelect}
      showSelectionInfo={showSelectionInfo}
      enableDragAndDrop={isLibrarian && isMapPage}
      enableAddPlaces={isLibrarian && isMapPage}
      placeType="icon"
    />
  );
}
