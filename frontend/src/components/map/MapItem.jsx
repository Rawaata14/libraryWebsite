/*
  MapItem.jsx
  -----------
  רכיב שמציג אייקון אחד על גבי מפת הספרייה ומנהל לחיצה ונעילת גרירה.
*/

import chairIcon from "../../assets/icons/seat-to-add.png";
import singleSeatIcon from "../../assets/icons/single-seat.png";
import table4Icon from "../../assets/icons/table-4.png";
import table8Icon from "../../assets/icons/table-8.png";
import computerSeatIcon from "../../assets/icons/computer-seat.png";
import receptionIcon from "../../assets/icons/reception.png";

import PropTypes from "prop-types";
import { seatPropType } from "../../propTypes/seatPropTypes";

const icons = {
  seat: chairIcon,
  "single-seat": singleSeatIcon,
  "table-4": table4Icon,
  "table-8": table8Icon,
  "computer-seat": computerSeatIcon,
  reception: receptionIcon,
};

export default function MapItem({
  item,
  isSelected,
  onSelect,
  isLibrarian,
  setDraggingItemId,
  style, // 💡 מקבלים את הסטייל שנשלח מ-LibraryMap (מכיל את ה-pointerEvents: "auto")
  isClickable = true, // 💡 פרופ חדש שמאפשר לשלוט אם הפריט ניתן ללחיצה או לא (ברירת מחדל: כן)
}) {
  const handlePointerDown = (e) => {
    if (!isLibrarian) return;

    e.preventDefault();
    // 🔒 נועל את כל תנועות העכבר/מצביע על הרהיט הזה
    e.currentTarget.setPointerCapture(e.pointerId);

    if (onSelect) {
      onSelect(item.seatId);
      setDraggingItemId(item.seatId);
    }
  };

  const handlePointerUp = (e) => {
    if (!isLibrarian) return;
    // 🔓 משחרר את הנעילה כשהרמנו את האצבע מהעכבר
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleClick = () => {
    if (isClickable && onSelect) {
      onSelect(item.seatId);
    }
  };

  return (
    <button
      type="button"
      className={`mapIconItem ${item.type} ${item.status} ${
        isSelected ? "selected" : ""
      }`}
      style={{
        ...style, // 🔥 מיזוג הסטייל החיצוני (כולל pointerEvents: "auto" שמציל את הגרירה!)

        left: `${item.x}%`,
        top: `${item.y}%`,
        "--item-rotation": `${item.rotation || 0}deg`,
        touchAction: "none", // 📱 מונע מהדפדפן לגלול את המסך בניידים בזמן גרירה
        pointerEvents: isClickable ? "auto" : "none", // 💡 אם הפריט לא ניתן ללחיצה, מבטל את האירוע
        cursor: isClickable ? "pointer" : "default", // 💡 משנה את הסמן בהתאם ליכולת הלחיצה
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      title={`${item.type} - ${item.status}`}
    >
      <img src={icons[item.type]} alt={item.type} draggable={false} />
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
  onMove: PropTypes.func,
  isLibrarian: PropTypes.bool.isRequired,
  setDraggingItemId: PropTypes.func.isRequired,
  style: PropTypes.object,
  isClickable: PropTypes.bool,
};
