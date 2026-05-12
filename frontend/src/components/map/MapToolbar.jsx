/*
  =========================================================
  MapToolbar.jsx
  =========================================================

  סרגל ניהול המפה עבור הספרן.

  אחריות:
  ---------------------------------------------------------
  ✔ בחירת סוג אובייקט להוספה
  ✔ הוספת אובייקט חדש
  ✔ סיבוב אובייקט
  ✔ חסימה / ביטול חסימה
  ✔ מחיקת אובייקט

  הקומפוננטה מקבלת פונקציות מהקומפוננטה הראשית
  LibraryMap.jsx

  =========================================================
*/

export default function MapToolbar({
  // סוג האובייקט החדש
  newItemType,

  // שינוי סוג האובייקט
  onChangeType,

  // הוספת אובייקט
  onAdd,

  // מחיקה
  onDelete,

  // חסימה / ביטול חסימה
  onToggleBlock,

  // סיבוב
  onRotate,

  // האם קיים אובייקט נבחר
  hasSelectedItem,
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
        <option value="seat">Chair</option>

        <option value="single-seat">Single Study Seat</option>

        <option value="table-4">Table 4</option>

        <option value="table-8">Table 8</option>

        <option value="computer-seat">Computer Seat</option>

        <option value="reception">Reception</option>
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
      </div>
    </div>
  );
}
