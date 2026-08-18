/*
=========================================================
MapItem.jsx

תיאור הקובץ:
רכיב המציג פריט יחיד על גבי מפת הספרייה.

הקומפוננטה אחראית על:
- הצגת האייקון המתאים לסוג הפריט.
- בחירת מושב פנוי על ידי המשתמש.
- בחירת וגרירת פריטים על ידי הספרנית.
- מניעת בחירה של מושבים תפוסים או חסומים.
- הוספת מידע נגיש לכפתורי המפה.
=========================================================
*/

import PropTypes from "prop-types";

import chairIcon from "../../assets/icons/seat-to-add.png";
import singleSeatIcon from "../../assets/icons/single-seat.png";
import table4Icon from "../../assets/icons/table-4.png";
import table8Icon from "../../assets/icons/table-8.png";
import computerSeatIcon from "../../assets/icons/computer-seat.png";
import receptionIcon from "../../assets/icons/reception.png";

import { seatPropType } from "../../propTypes/seatPropTypes";

/*
---------------------------------------------------------
icons

תפקיד:
מתאים בין סוג פריט המפה לבין קובץ התמונה שלו.

קיימת תמיכה גם בשם seat וגם בשם seat-to-add,
כדי לתמוך בפריטים קיימים ובפריטים חדשים.
---------------------------------------------------------
*/
const icons = {
  seat: chairIcon,
  "seat-to-add": chairIcon,
  "single-seat": singleSeatIcon,
  "table-4": table4Icon,
  "table-8": table8Icon,
  "computer-seat": computerSeatIcon,
  reception: receptionIcon,
};

/*
---------------------------------------------------------
getItemAccessibleLabel

תפקיד:
יוצרת תיאור ברור עבור קוראי מסך וטכנולוגיות מסייעות.
---------------------------------------------------------
*/
const getItemAccessibleLabel = (item) => {
  const itemNumber = item.seatId ? ` ${item.seatId}` : "";
  const location = item.location
    ? ` in ${item.location.replaceAll("-", " ")}`
    : "";

  return `${item.type}${itemNumber}${location}, status: ${item.status}`;
};

/*
---------------------------------------------------------
MapItem

תפקיד:
מציגה פריט מפה ומנהלת בחירה וגרירה בהתאם
להרשאות המשתמש ולמצב הפריט.
---------------------------------------------------------
*/
export default function MapItem({
  item,
  isSelected,
  onSelect,
  isLibrarian,
  setDraggingItemId,
  style,
  isClickable = true,
}) {
  const itemIcon = icons[item.type] || chairIcon;
  const accessibleLabel = getItemAccessibleLabel(item);

  /*
  -------------------------------------------------------
  handlePointerDown

  תפקיד:
  מתחילה בחירה וגרירה של פריט במצב ניהול.
  משתמש רגיל אינו יכול לגרור פריטי מפה.
  -------------------------------------------------------
  */
  const handlePointerDown = (event) => {
    if (!isLibrarian || !isClickable) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    onSelect(item.seatId);
    setDraggingItemId(item.seatId);
  };

  /*
  -------------------------------------------------------
  handlePointerUp

  תפקיד:
  משחררת את נעילת המצביע לאחר סיום גרירת פריט.
  -------------------------------------------------------
  */
  const handlePointerUp = (event) => {
    if (!isLibrarian) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  /*
  -------------------------------------------------------
  handleClick

  תפקיד:
  בוחרת את הפריט רק אם הוא ניתן לבחירה.
  -------------------------------------------------------
  */
  const handleClick = () => {
    if (!isClickable) {
      return;
    }

    onSelect(item.seatId);
  };

  return (
    <button
      type="button"
      disabled={!isClickable}
      aria-label={accessibleLabel}
      aria-pressed={isSelected}
      className={`mapIconItem ${item.type} ${item.status} ${
        isSelected ? "selected" : ""
      }`}
      style={{
        ...style,
        left: `${item.x}%`,
        top: `${item.y}%`,
        "--item-rotation": `${item.rotation || 0}deg`,
        touchAction: "none",
        pointerEvents: isClickable ? "auto" : "none",
        cursor: isClickable ? "pointer" : "not-allowed",
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      title={accessibleLabel}
    >
      <img src={itemIcon} alt="" aria-hidden="true" draggable={false} />
    </button>
  );
}

/*
---------------------------------------------------------
MapItem.propTypes

תפקיד:
מגדיר את פריט המפה ואת פעולות הבחירה והגרירה
שהקומפוננטה מקבלת.
---------------------------------------------------------
*/
MapItem.propTypes = {
  item: seatPropType.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  isLibrarian: PropTypes.bool.isRequired,
  setDraggingItemId: PropTypes.func.isRequired,
  style: PropTypes.object,
  isClickable: PropTypes.bool,
};
