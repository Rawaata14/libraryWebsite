/*
=========================================================
useMapDragging.js

תיאור הקובץ:
Custom Hook המרכז את פעולות הגרירה והמיקום
של פריטים במפת הספרייה.

ה-Hook אחראי על:
- המרת מיקום הסמן לאחוזים במפה.
- זיהוי האזור שמתחת לסמן.
- גרירת פריטים בתוך האזור המותר.
- עדכון מיקום פריט.
- סיום פעולת הגרירה.
=========================================================
*/

import { useRef, useState } from "react";

import {
  clampPositionToZone,
  getZoneByPosition,
  isInsideAllowedZone,
  mapZones,
} from "../utils/mapUtils";

/*
---------------------------------------------------------
useMapDragging

תפקיד:
מספק את המצב והפעולות הדרושים לגרירת
פריטים בתוך מפת הספרייה.
---------------------------------------------------------
*/
export default function useMapDragging({ items, setItems }) {
  const mapRef = useRef(null);

  const [hoveredZoneId, setHoveredZoneId] = useState(null);
  const [draggingItemId, setDraggingItemId] = useState(null);

  /*
  ---------------------------------------------------------
  getMapPercentPosition

  תפקיד:
  ממירה את קואורדינטות הסמן לאחוזים
  יחסיים בתוך שטח המפה.
  ---------------------------------------------------------
  */
  const getMapPercentPosition = (clientX, clientY) => {
    if (!mapRef.current) {
      return null;
    }

    const rectangle = mapRef.current.getBoundingClientRect();

    const x = ((clientX - rectangle.left) / rectangle.width) * 100;

    const y = ((clientY - rectangle.top) / rectangle.height) * 100;

    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    };
  };

  /*
  ---------------------------------------------------------
  handleMapPointerMove

  תפקיד:
  מזהה את האזור שמתחת לסמן ומזיזה את הפריט
  הנגרר בתוך גבולות האזור שלו.
  ---------------------------------------------------------
  */
  const handleMapPointerMove = (event) => {
    const position = getMapPercentPosition(event.clientX, event.clientY);

    if (!position) {
      return;
    }

    const hoveredZone = getZoneByPosition(position.x, position.y);

    setHoveredZoneId(hoveredZone?.id || null);

    if (!draggingItemId) {
      return;
    }

    const currentItem = items.find((item) => item.seatId === draggingItemId);

    if (!currentItem) {
      return;
    }

    const allowedZone = mapZones.find(
      (zone) => zone.id === currentItem.location,
    );

    if (!allowedZone && !isInsideAllowedZone(position.x, position.y)) {
      return;
    }

    const targetPosition = clampPositionToZone(
      position.x,
      position.y,
      allowedZone,
    );

    setItems((previousItems) =>
      previousItems.map((item) =>
        item.seatId === draggingItemId
          ? {
              ...item,
              x: targetPosition.x,
              y: targetPosition.y,
            }
          : item,
      ),
    );
  };

  /*
  ---------------------------------------------------------
  stopDragging

  תפקיד:
  מסיימת את פעולת הגרירה הפעילה.
  ---------------------------------------------------------
  */
  const stopDragging = () => {
    setDraggingItemId(null);
  };

  /*
  ---------------------------------------------------------
  handleMapPointerLeave

  תפקיד:
  מנקה את האזור המסומן ומסיימת את הגרירה
  כאשר הסמן יוצא משטח המפה.
  ---------------------------------------------------------
  */
  const handleMapPointerLeave = () => {
    setHoveredZoneId(null);
    stopDragging();
  };

  /*
  ---------------------------------------------------------
  updateItemPosition

  תפקיד:
  מעדכנת את מיקום הפריט לפי קואורדינטות הסמן,
  בתנאי שהמיקום נמצא באזור מותר.
  ---------------------------------------------------------
  */
  const updateItemPosition = (seatId, clientX, clientY) => {
    const position = getMapPercentPosition(clientX, clientY);

    if (!position || !isInsideAllowedZone(position.x, position.y)) {
      return;
    }

    setItems((previousItems) =>
      previousItems.map((item) =>
        item.seatId === seatId
          ? {
              ...item,
              x: position.x,
              y: position.y,
            }
          : item,
      ),
    );
  };

  return {
    mapRef,
    hoveredZoneId,
    setDraggingItemId,
    handleMapPointerMove,
    stopDragging,
    handleMapPointerLeave,
    updateItemPosition,
  };
}
