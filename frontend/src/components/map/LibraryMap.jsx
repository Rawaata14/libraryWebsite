/*
=========================================================
LibraryMap.jsx

תיאור הקובץ:
רכיב התצוגה של מפת הספרייה האינטראקטיבית.

הקומפוננטה אחראית על:
- הצגת סרגל כלי הניהול לספרנית.
- הצגת רקע המפה ואזורי הספרייה.
- הצגת פריטי המפה והמושבים.
- קביעה אילו פריטים ניתנים לבחירה.
- הצגת פרטי הפריט הנבחר במצב ניהול.

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
RESERVABLE_ITEM_TYPES

תפקיד:
מגדיר אילו סוגי פריטים במפה מייצגים מקומות
ישיבה שניתן להזמין.

שולחנות ועמדת הקבלה אינם נכללים ברשימה.
---------------------------------------------------------
*/
const RESERVABLE_ITEM_TYPES = [
  "seat",
  "seat-to-add",
  "single-seat",
  "computer-seat",
];

/*
---------------------------------------------------------
LibraryMap

תפקיד:
מחברת בין לוגיקת המפה שב-Hook לבין רכיבי
התצוגה של המפה.
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
    cancelChanges,
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

      מוצג רק לספרנית שנמצאת בדף ניהול המפה.
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
          cancelChanges={cancelChanges}
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
        role="region"
        aria-label="Interactive library seating map"
        onPointerMove={handleMapPointerMove}
        onPointerUp={stopDragging}
        onPointerLeave={handleMapPointerLeave}
      >
        {/*
        תמונת הרקע משמשת לצורכי עיצוב בלבד.
        המושבים האינטראקטיביים מקבלים תיאור נגיש בנפרד.
        */}
        <img
          src="/images/library-map.png"
          alt=""
          aria-hidden="true"
          className="dynamicMapBackground"
        />

        {/*
        ==================================================
        כותרות אזורי המפה
        ==================================================
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
        ==================================================
        פריטי המפה

        משתמש רגיל:
        יכול לבחור רק מקום ישיבה פנוי.

        ספרנית:
        יכולה לבחור כל פריט לצורך עריכה וניהול.
        ==================================================
        */}

        {items.map((item) => {
          const isTable = item.type === "table-4" || item.type === "table-8";

          const isReservableItem = RESERVABLE_ITEM_TYPES.includes(item.type);

          /*
-------------------------------------------------
בדיקת אפשרות בחירת הפריט

ספרנית:
יכולה לבחור כל פריט לצורך עריכה וניהול.

משתמש:
יכול לבחור כל פריט שמייצג מקום ישיבה, כל עוד
המקום אינו חסום מנהלית.

מצב available:
פותח תהליך הזמנה רגיל.

מצב occupied, reserved או unavailable:
פותח תהליך הצטרפות לרשימת המתנה.

מצב blocked:
אינו ניתן להזמנה או להמתנה.
-------------------------------------------------
*/
          const normalizedItemStatus = String(item.status || "").toLowerCase();

          const isItemClickable =
            isLibrarian ||
            (isReservableItem && normalizedItemStatus !== "blocked");

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
                isLibrarian={isLibrarian}
                setDraggingItemId={setDraggingItemId}
                isClickable={isItemClickable}
              />
            </div>
          );
        })}
      </div>

      {/*
      =====================================================
      פרטי הפריט הנבחר

      מוצגים רק במצב ניהול מפה.
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
