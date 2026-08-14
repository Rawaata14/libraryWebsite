/*
=========================================================
useLibraryMap.js

תיאור הקובץ:
Custom Hook המרכז את מצב ולוגיקת מפת הספרייה.

ה-Hook אחראי על:
- בחירת סוג ומיקום של פריט חדש.
- הוספה ומחיקה של פריטים.
- חסימה וסיבוב של פריטים.
- גרירת פריטים בתוך האזורים המותרים.
- שמירת המפה ורענונה מהשרת.
=========================================================
*/

import { useRef, useState } from "react";

import { deleteMapItem, saveLibraryMap } from "../services/mapService";

import {
  clampPositionToZone,
  getZoneByPosition,
  isInsideAllowedZone,
  mapZones,
} from "../utils/mapUtils";

/*
---------------------------------------------------------
useLibraryMap

תפקיד:
מספק לקומפוננטת LibraryMap את כל הנתונים
והפעולות הדרושים להצגה ולעריכת המפה.
---------------------------------------------------------
*/
export default function useLibraryMap({
  items,
  setItems,
  selectedSeatId,
  onSeatSelect,
  fetchLatestSeats,
}) {
  const [newItemType, setNewItemType] = useState("seat");

  const [newItemPlacement, setNewItemPlacement] = useState(mapZones[0].id);

  const [hoveredZoneId, setHoveredZoneId] = useState(null);

  const [draggingItemId, setDraggingItemId] = useState(null);

  const mapRef = useRef(null);

  const selectedItem = items.find((item) => item.seatId === selectedSeatId);

  /*
  ---------------------------------------------------------
  addItem

  תפקיד:
  מוסיפה פריט זמני במרכז האזור שנבחר
  ומסמנת אותו כפריט הנבחר.
  ---------------------------------------------------------
  */
  const addItem = () => {
    const zone = mapZones.find(
      (currentZone) => currentZone.id === newItemPlacement,
    );

    if (!zone) {
      return;
    }

    const generatedId = `temp-${Date.now()}`;

    const newItem = {
      seatId: generatedId,
      type: newItemType,
      x: (zone.minX + zone.maxX) / 2,
      y: (zone.minY + zone.maxY) / 2,
      rotation: 0,
      status: "available",
      reservable: ["seat-to-add", "single-seat", "computer-seat"].includes(
        newItemType,
      ),
      location: zone.id,
    };

    setItems((previousItems) => [...previousItems, newItem]);

    onSeatSelect({
      id: generatedId,
      status: newItem.status,
      location: newItem.location,
    });
  };

  /*
  ---------------------------------------------------------
  deleteItem

  תפקיד:
  מוחקת פריט זמני מה-State או פריט קיים
  מהשרת ולאחר מכן מהרשימה המקומית.
  ---------------------------------------------------------
  */
  const deleteItem = async () => {
    if (!selectedSeatId) {
      return;
    }

    if (String(selectedSeatId).startsWith("temp-")) {
      setItems((previousItems) =>
        previousItems.filter((item) => item.seatId !== selectedSeatId),
      );

      onSeatSelect(null);
      return;
    }

    const userConfirmed = window.confirm(
      "האם את בטוחה שברצונך למחוק פריט זה לצמיתות מבסיס הנתונים?",
    );

    if (!userConfirmed) {
      return;
    }

    try {
      const response = await deleteMapItem(selectedSeatId);

      if (response.status === 200 || response.status === 204) {
        setItems((previousItems) =>
          previousItems.filter((item) => item.seatId !== selectedSeatId),
        );

        onSeatSelect(null);
        window.alert("הפריט נמחק בהצלחה!");
      } else {
        window.alert("מחיקת הפריט נכשלה בשרת.");
      }
    } catch (error) {
      console.error("Error deleting map item:", error);

      window.alert("אירעה שגיאה בזמן מחיקת הפריט.");
    }
  };

  /*
  ---------------------------------------------------------
  toggleBlockItem

  תפקיד:
  מחליפה את סטטוס הפריט הנבחר בין
  available לבין blocked.
  ---------------------------------------------------------
  */
  const toggleBlockItem = () => {
    if (!selectedSeatId) {
      return;
    }

    setItems((previousItems) =>
      previousItems.map((item) =>
        item.seatId === selectedSeatId
          ? {
              ...item,
              status: item.status === "blocked" ? "available" : "blocked",
            }
          : item,
      ),
    );
  };

  /*
  ---------------------------------------------------------
  rotateSelectedItem

  תפקיד:
  מסובבת את הפריט הנבחר ב-90 מעלות.
  ---------------------------------------------------------
  */
  const rotateSelectedItem = () => {
    if (!selectedSeatId) {
      return;
    }

    setItems((previousItems) =>
      previousItems.map((item) =>
        item.seatId === selectedSeatId
          ? {
              ...item,
              rotation: ((item.rotation || 0) + 90) % 360,
            }
          : item,
      ),
    );
  };

  /*
  ---------------------------------------------------------
  handleItemSelect

  תפקיד:
  מאתרת את הפריט שנלחץ ומעבירה את פרטיו
  לקומפוננטה האב.
  ---------------------------------------------------------
  */
  const handleItemSelect = (seatId) => {
    const clickedItem = items.find((item) => item.seatId === seatId);

    if (!clickedItem) {
      return;
    }

    onSeatSelect({
      id: clickedItem.seatId,
      status: clickedItem.status,
      location: clickedItem.location,
    });
  };

  /*
  ---------------------------------------------------------
  getMapPercentPosition

  תפקיד:
  ממירה קואורדינטות מסך לאחוזים
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
  מעדכנת את האזור שנמצא תחת הסמן,
  ומזיזה את הפריט הנגרר בתוך גבולות האזור שלו.
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
  מסיימת את פעולת הגרירה.
  ---------------------------------------------------------
  */
  const stopDragging = () => {
    setDraggingItemId(null);
  };

  /*
  ---------------------------------------------------------
  handleMapPointerLeave

  תפקיד:
  מנקה את האזור המסומן ומסיימת גרירה
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
  מעדכנת מיקום פריט לפי קואורדינטות הסמן,
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

  /*
  ---------------------------------------------------------
  saveMap

  תפקיד:
  שומרת את מבנה המפה בשרת ומרעננת
  את הפריטים לאחר שמירה מוצלחת.
  ---------------------------------------------------------
  */
  const saveMap = async () => {
    try {
      const response = await saveLibraryMap(items);

      if (response.status !== 200 && response.status !== 201) {
        window.alert("Failed to save map. Please try again.");
        return;
      }

      window.alert("Map saved successfully!");
      onSeatSelect(null);

      if (fetchLatestSeats) {
        await fetchLatestSeats();
      }
    } catch (error) {
      console.error("Error saving library map:", error);

      window.alert("An error occurred while saving the map. Please try again.");
    }
  };

  return {
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
  };
}
