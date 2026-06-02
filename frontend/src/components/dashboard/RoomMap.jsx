/*
  RoomMap.jsx
  -----------
  עטיפה למפת הספרייה.

  אחריות:
  - בדיקה האם אנחנו בדף המפה
  - הפעלת מצב ניהול רק לספרן בתוך /map
*/

import {useContext} from "react";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import LibraryMap from "../map/LibraryMap";

export default function RoomMap({
  selectedSeatId = null,
  onSeatSelect = () => {},
  showSelectionInfo = true,
}) {
  const { isLibrarian } = useContext(AuthContext);

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
