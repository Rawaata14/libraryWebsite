/*
  MapItem.jsx
  -----------
  רכיב שמציג אייקון אחד על גבי מפת הספרייה.
*/

import singleSeatIcon from "../../assets/icons/single-seat.png";
import table4Icon from "../../assets/icons/table-4.png";
import table8Icon from "../../assets/icons/table-8.png";
import computerSeatIcon from "../../assets/icons/computer-seat.png";
import receptionIcon from "../../assets/icons/reception.png";

const icons = {
  "single-seat": singleSeatIcon,
  "table-4": table4Icon,
  "table-8": table8Icon,
  "computer-seat": computerSeatIcon,
  reception: receptionIcon,
};

export default function MapItem({ item, isSelected, onSelect }) {
  return (
    <button
      type="button"
      className={`mapIconItem ${item.status} ${isSelected ? "selected" : ""}`}
      style={{
        left: `${item.x}%`,
        top: `${item.y}%`,
      }}
      onClick={() => onSelect(item.id)}
      title={`${item.type} - ${item.status}`}
    >
      <img src={icons[item.type]} alt={item.type} />
    </button>
  );
}
