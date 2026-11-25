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
  const dragRef = useRef(null);

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

  const setDraggingItemId = (seatId, event) => {
    if (seatId == null || !event || !mapRef.current) {
      dragRef.current = null;
      return;
    }

    const currentItem = items.find((item) => item.seatId === seatId);

    if (!currentItem) {
      return;
    }

    dragRef.current = {
      seatId,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startItemX: Number(currentItem.x),
      startItemY: Number(currentItem.y),
      hasMoved: false,
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

    const drag = dragRef.current;

    if (!drag || event.pointerId !== drag.pointerId) {
      return;
    }

    const deltaX = event.clientX - drag.startClientX;
    const deltaY = event.clientY - drag.startClientY;

    // התחלת גרירה רק לאחר תנועה של לפחות 5 פיקסלים
    if (!drag.hasMoved) {
      if (Math.hypot(deltaX, deltaY) < 5) {
        return;
      }

      drag.hasMoved = true;
    }

    const currentItem = items.find((item) => item.seatId === drag.seatId);

    if (!currentItem || !mapRef.current) {
      return;
    }

    const rectangle = mapRef.current.getBoundingClientRect();

    // חישוב המיקום ביחס לנקודת האחיזה המקורית
    const targetX = drag.startItemX + (deltaX / rectangle.width) * 100;

    const targetY = drag.startItemY + (deltaY / rectangle.height) * 100;

    const allowedZone = mapZones.find(
      (zone) => zone.id === currentItem.location,
    );

    if (!allowedZone && !isInsideAllowedZone(targetX, targetY)) {
      return;
    }

    const targetPosition = clampPositionToZone(targetX, targetY, allowedZone);

    setItems((previousItems) =>
      previousItems.map((item) =>
        item.seatId === drag.seatId
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
    dragRef.current = null;
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
