/*
  RoomMap.jsx
  -----------
  עטיפה למפת הספרייה.

  אחריות:
  - בדיקה האם אנחנו בדף המפה
  - הפעלת מצב ניהול רק לספרן בתוך /map
*/

import { useLocation } from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import LibraryMap from "../map/LibraryMap";

export default function RoomMap({
  selectedSeatId = null,
  onSeatSelect = () => {},
  showSelectionInfo = true,
}) {
  const { isLibrarian } = useAuth();

  const location = useLocation();

  /* toolbar יוצג רק בדף /map */
  const isMapPage = location.pathname === "/map";

  return (
    <LibraryMap
      isLibrarian={isLibrarian && isMapPage}
      selectedSeatId={selectedSeatId}
      onSeatSelect={onSeatSelect}
      showSelectionInfo={showSelectionInfo}
      enableDragAndDrop={isLibrarian && isMapPage}
      enableAddPlaces={isLibrarian && isMapPage}
      placeType="icon"
    />
  );
}
