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
}) {
  const handlePointerDown = (e) => {
    if (!isLibrarian) return;

    e.preventDefault();
    // 🔒 נועל את כל תנועות העכבר/מצביע על הרהיט הזה
    e.currentTarget.setPointerCapture(e.pointerId);

    onSelect(item.seatId);
    setDraggingItemId(item.seatId);
  };

  const handlePointerUp = (e) => {
    if (!isLibrarian) return;
    // 🔓 משחרר את הנעילה כשהרמנו את האצבע מהעכבר
    e.currentTarget.releasePointerCapture(e.pointerId);
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
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      title={`${item.type} - ${item.status}`}
    >
      <img src={icons[item.type]} alt={item.type} draggable={false} />
    </button>
  );
}
