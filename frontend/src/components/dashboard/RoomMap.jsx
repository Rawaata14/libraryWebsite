/*
  RoomMap.jsx
  -----------
  עטיפה חכמה למפת הספרייה.

  אחריות:
  - משיכת הרהיטים וניהול הסטייט מול מסד הנתונים
  - בדיקה האם אנחנו בדף המפה הראשי או דף המנהל
  - הפעלת מצב ניהול רק לספרן ובתוך הדף המתאים
*/

import { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import LibraryMap from "../map/LibraryMap";
import axios from "axios";

export default function RoomMap({
  selectedSeatId = null,
  onSeatSelect = () => {},
  showSelectionInfo = true,
}) {
  const { isLibrarian } = useContext(AuthContext);
  const location = useLocation();

  // הסטייט הראשי של הרהיטים באפליקציה (Single Source of Truth)
  const [items, setItems] = useState([]);

  // 💡 הוצאת פונקציית הטעינה החוצה כדי שנוכל להעביר אותה גם ל-LibraryMap
  const fetchSeats = async () => {
    try {
      const response = await axios.get("http://localhost:8000/seats/get-map", {
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
    }
  };

  // משיכת הרהיטים המעודכנים מהשרת ברגע שהקומפוננטה נטענת לראשונה
  useEffect(() => {
    fetchSeats();
  }, []);

  /* toolbar וניהול יוצגו רק בדף המפה הראשי או בדף המנהל */
  const isMapPage =
    location.pathname === "/map" || location.pathname === "/admin/map";

  return (
    <LibraryMap
      isLibrarian={isLibrarian && isMapPage}
      items={items}
      setItems={setItems}
      fetchLatestSeats={fetchSeats} // 🔥 הוספת הפרופ החדש! מאפשר ל-LibraryMap לרענן את המפה אחרי שמירה
      selectedSeatId={selectedSeatId}
      onSeatSelect={onSeatSelect}
      showSelectionInfo={showSelectionInfo}
      enableDragAndDrop={isLibrarian && isMapPage}
      enableAddPlaces={isLibrarian && isMapPage}
      placeType="icon"
    />
  );
}
