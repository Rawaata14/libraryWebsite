/*
=========================================================
useLibraryMap.js

תיאור הקובץ:
Custom Hook המרכז את מצב ולוגיקת עריכת מפת הספרייה.

ה-Hook אחראי על:
- בחירת סוג ומיקום של פריט חדש.
- הוספה ומחיקה של פריטים.
- חסימה וסיבוב של פריטים.
- שמירת המפה ורענונה מהשרת.

פעולות הגרירה מנוהלות דרך useMapDragging.
=========================================================
*/

import { useState } from "react";

import useMapDragging from "./useMapDragging";

import { deleteMapItem, saveLibraryMap } from "../services/mapService";

import { getAvailablePositionInZone, mapZones } from "../utils/mapUtils";

/*
---------------------------------------------------------
useLibraryMap

תפקיד:
מספק לקומפוננטת LibraryMap את הנתונים
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

  const selectedItem = items.find((item) => item.seatId === selectedSeatId);

  const {
    mapRef,
    hoveredZoneId,
    setDraggingItemId,
    handleMapPointerMove,
    stopDragging,
    handleMapPointerLeave,
    updateItemPosition,
  } = useMapDragging({
    items,
    setItems,
  });

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

    const availablePosition = getAvailablePositionInZone(zone, items);

    const newItem = {
      seatId: generatedId,
      type: newItemType,
      x: availablePosition.x,
      y: availablePosition.y,
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
