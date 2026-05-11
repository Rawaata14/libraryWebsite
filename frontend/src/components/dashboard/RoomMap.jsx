/*
  RoomMap.jsx
  -----------
*/

import useAuth from "../../hooks/useAuth";
import LibraryMap from "../map/LibraryMap";

export default function RoomMap({
  selectedSeatId = null,
  onSeatSelect = () => {},
  showSelectionInfo = true,
}) {
  const { isLibrarian } = useAuth();

  return (
    <LibraryMap
      isLibrarian={isLibrarian}
      selectedSeatId={selectedSeatId}
      onSeatSelect={onSeatSelect}
      showSelectionInfo={showSelectionInfo}
      enableDragAndDrop={isLibrarian}
      enableAddPlaces={isLibrarian}
      placeType="icon"
    />
  );
}
