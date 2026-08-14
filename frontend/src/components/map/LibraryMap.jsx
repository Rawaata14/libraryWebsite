/*
=========================================================
LibraryMap.jsx

תיאור הקובץ:
רכיב התצוגה של מפת הספרייה האינטראקטיבית.

הקומפוננטה אחראית על:
- הצגת סרגל כלי הניהול לספרן.
- הצגת רקע המפה ואזורי הספרייה.
- הצגת פריטי המפה.
- הצגת פרטי הפריט הנבחר.

מצב העריכה והפעולות מנוהלים באמצעות:
useLibraryMap
=========================================================
*/

import PropTypes from "prop-types";

import MapItem from "./MapItem";
import MapToolbar from "./MapToolbar";

import useLibraryMap from "../../hooks/useLibraryMap";
import { mapZones } from "../../utils/mapUtils";
import { seatPropType } from "../../propTypes/seatPropTypes";

/*
---------------------------------------------------------
LibraryMap

תפקיד:
מחברת בין לוגיקת המפה שב-Hook
לבין רכיבי התצוגה של המפה.
---------------------------------------------------------
*/
export default function LibraryMap({
  isLibrarian = true,
  items = [],
  setItems,
  onSeatSelect,
  fetchLatestSeats,
  selectedSeatId,
}) {
  const {
    mapRef,
    selectedItem,
    newItemType,
    setNewItemType,
    newItemPlacement,
    setNewItemPlacement,
    hoveredZoneId,
    setDraggingItemId,
    addItem,
    deleteItem,
    toggleBlockItem,
    rotateSelectedItem,
    handleItemSelect,
    handleMapPointerMove,
    stopDragging,
    handleMapPointerLeave,
    updateItemPosition,
    saveMap,
  } = useLibraryMap({
    items,
    setItems,
    selectedSeatId,
    onSeatSelect,
    fetchLatestSeats,
  });

  return (
    <div className="dynamicMapWrapper">
      {/*
      =====================================================
      סרגל ניהול המפה
      =====================================================
      */}

      {isLibrarian && (
        <MapToolbar
          newItemType={newItemType}
          onChangeType={setNewItemType}
          newItemPlacement={newItemPlacement}
          onChangePlacement={setNewItemPlacement}
          mapZones={mapZones}
          onAdd={addItem}
          onDelete={deleteItem}
          onToggleBlock={toggleBlockItem}
          onRotate={rotateSelectedItem}
          hasSelectedItem={Boolean(selectedSeatId)}
          saveMap={saveMap}
        />
      )}

      {/*
      =====================================================
      משטח המפה
      =====================================================
      */}

      <div
        className="dynamicMapCanvas"
        ref={mapRef}
        onPointerMove={handleMapPointerMove}
        onPointerUp={stopDragging}
        onPointerLeave={handleMapPointerLeave}
      >
        <img
          src="/images/library-map.png"
          alt="Library map"
          className="dynamicMapBackground"
        />

        {/*
        ===================================================
        כותרות אזורי המפה
        ===================================================
        */}

        {mapZones.map((zone) => (
          <div
            key={zone.id}
            className={`mapZoneLabel ${
              hoveredZoneId === zone.id ? "hiddenZoneLabel" : ""
            }`}
            style={{
              left: `${zone.labelX}%`,
              top: `${zone.labelY}%`,
            }}
          >
            {zone.label}
          </div>
        ))}

        {/*
        ===================================================
        פריטי המפה
        ===================================================
        */}

        {items.map((item) => {
          const isTable = item.type === "table-4" || item.type === "table-8";

          const isSeatClickable = isLibrarian || !isTable;

          return (
            <div
              key={item.seatId}
              style={{
                position: "absolute",
                zIndex: isTable ? 2 : 1,
                left: 0,
                top: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            >
              <MapItem
                item={item}
                isSelected={selectedSeatId === item.seatId}
                onSelect={handleItemSelect}
                onMove={updateItemPosition}
                isLibrarian={isLibrarian}
                setDraggingItemId={setDraggingItemId}
                isClickable={isSeatClickable}
              />
            </div>
          );
        })}
      </div>

      {/*
      =====================================================
      פרטי הפריט הנבחר
      =====================================================
      */}

      {isLibrarian && selectedItem && (
        <div className="mapEditPanel">
          <strong>Selected:</strong> {selectedItem.type}
          <p>
            X: {Math.round(selectedItem.x)}%{" | "}
            Y: {Math.round(selectedItem.y)}%{" | "}
            Rotation: {selectedItem.rotation || 0}°{" | "}
            Status: {selectedItem.status}
          </p>
          <p>Drag the item with the mouse to reposition it.</p>
        </div>
      )}
    </div>
  );
}

/*
---------------------------------------------------------
LibraryMap.propTypes

תפקיד:
מגדיר את פריטי המפה והפעולות שמתקבלות
מקומפוננטת RoomMap.
---------------------------------------------------------
*/
LibraryMap.propTypes = {
  isLibrarian: PropTypes.bool,
  items: PropTypes.arrayOf(seatPropType),
  setItems: PropTypes.func.isRequired,
  onSeatSelect: PropTypes.func.isRequired,
  fetchLatestSeats: PropTypes.func,
  selectedSeatId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};
