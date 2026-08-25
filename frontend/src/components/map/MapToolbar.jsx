/*
  MapToolbar.jsx
  =========================================================
  סרגל ניהול המפה עבור הספרן.

  אחריות:
  ---------------------------------------------------------
  ✔ בחירת סוג אובייקט להוספה (מסונכרן עם ה-Database)
  ✔ הוספת אובייקט חדש
  ✔ סיבוב אובייקט
  ✔ חסימה / ביטול חסימה
  ✔ מחיקת אובייקט
  ✔ שמירת המפה לשרת
  =========================================================
*/
import PropTypes from "prop-types";
import { mapZonePropType } from "../../propTypes/seatPropTypes";

export default function MapToolbar({
  newItemType,
  onChangeType,
  newItemPlacement,
  onChangePlacement,
  mapZones,
  onAdd,
  onDelete,
  onToggleBlock,
  onRotate,
  hasSelectedItem,
  cancelChanges,
  saveMap,
}) {
  return (
    <div className="mapToolbar">
      {/* ======================================
          בחירת סוג אובייקט
      ====================================== */}
      <select
        className="mapToolbarSelect"
        value={newItemType}
        onChange={(event) => onChangeType(event.target.value)}
      >
        {/* 💡 עודכן מ-"seat" ל-"seat-to-add" להתאמה מלאה ללוגיקת ההזמנות והאייקונים */}
        <option value="seat-to-add">Chair</option>
        <option value="single-seat">Single Study Seat</option>
        <option value="table-4">Table 4</option>
        <option value="table-8">Table 8</option>
        <option value="computer-seat">Computer Seat</option>
        <option value="reception">Reception</option>
      </select>

      {/* ======================================
          בחירת חדר/אזור להוספה
      ====================================== */}
      <select
        className="mapToolbarSelect"
        value={newItemPlacement}
        onChange={(event) => onChangePlacement(event.target.value)}
      >
        {mapZones.map((zone) => (
          <option key={zone.id} value={zone.id}>
            {zone.label}
          </option>
        ))}
      </select>

      {/* ======================================
          כפתורי פעולות
      ====================================== */}
      <div className="mapToolbarButtons">
        {/* הוספה */}
        <button type="button" onClick={onAdd}>
          Add
        </button>

        {/* סיבוב */}
        <button type="button" onClick={onRotate} disabled={!hasSelectedItem}>
          Rotate
        </button>

        {/* חסימה */}
        <button
          type="button"
          onClick={onToggleBlock}
          disabled={!hasSelectedItem}
        >
          Block / Unblock
        </button>

        {/* מחיקה */}
        <button type="button" onClick={onDelete} disabled={!hasSelectedItem}>
          Delete
        </button>

        {/* ביטול שינויים */}
        <button type="button" onClick={cancelChanges}>
          Cancel Changes
        </button>

        {/* שמירה */}
        <button type="button" onClick={saveMap}>
          Save Map
        </button>
      </div>
    </div>
  );
}

/*
---------------------------------------------------------
MapToolbar.propTypes

תפקיד:
מגדיר את נתוני סרגל ניהול המפה ואת פעולות הספרן.
---------------------------------------------------------
*/
MapToolbar.propTypes = {
  newItemType: PropTypes.string.isRequired,
  onChangeType: PropTypes.func.isRequired,
  newItemPlacement: PropTypes.string.isRequired,
  onChangePlacement: PropTypes.func.isRequired,
  mapZones: PropTypes.arrayOf(mapZonePropType).isRequired,
  onAdd: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleBlock: PropTypes.func.isRequired,
  onRotate: PropTypes.func.isRequired,
  hasSelectedItem: PropTypes.bool.isRequired,
  saveMap: PropTypes.func.isRequired,
  cancelChanges: PropTypes.func.isRequired,
};
