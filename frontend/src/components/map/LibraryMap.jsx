import { useRef, useState } from "react";
import MapItem from "./MapItem";
import MapToolbar from "./MapToolbar";
import axios from "axios";

const mapZones = [
  {
    id: "quiet-room",
    label: "Quiet Room",
    minX: 3,
    maxX: 34,
    minY: 16,
    maxY: 47,
    labelX: 18,
    labelY: 8,
  },
  {
    id: "computer-area",
    label: "Computer Area",
    minX: 38,
    maxX: 61,
    minY: 16,
    maxY: 42,
    labelX: 49,
    labelY: 8,
  },
  {
    id: "group-room",
    label: "Group Study Rooms",
    minX: 65,
    maxX: 97,
    minY: 16,
    maxY: 50,
    labelX: 81,
    labelY: 8,
  },
  {
    id: "reading-book",
    label: "Reading Book",
    minX: 2,
    maxX: 18,
    minY: 51,
    maxY: 80,
    labelX: 18,
    labelY: 57,
  },
  {
    id: "study-room-1",
    label: "Study Room 1",
    minX: 49,
    maxX: 63.5,
    minY: 54,
    maxY: 80,
    labelX: 57,
    labelY: 57,
  },
  {
    id: "study-room-2",
    label: "Study Room 2",
    minX: 65,
    maxX: 79.5,
    minY: 54,
    maxY: 80,
    labelX: 72,
    labelY: 57,
  },
  {
    id: "study-room-3",
    label: "Study Room 3",
    minX: 81.5,
    maxX: 98,
    minY: 54,
    maxY: 80,
    labelX: 89,
    labelY: 57,
  },
];

const isInsideAllowedZone = (x, y) => {
  return mapZones.some(
    (location) =>
      x >= location.minX &&
      x <= location.maxX &&
      y >= location.minY &&
      y <= location.maxY,
  );
};

const getZoneByPosition = (x, y) => {
  return mapZones.find(
    (location) =>
      x >= location.minX &&
      x <= location.maxX &&
      y >= location.minY &&
      y <= location.maxY,
  );
};

export default function LibraryMap({
  isLibrarian = true,
  items = [],
  setItems,
  onSeatSelect,
  fetchLatestSeats, // 💡 נקבל את פונקציית הרענון של השרת ישירות מקומפוננטת העטיפה האבא
  selectedSeatId, // 💡 מזהה הכיסא הנבחר שמגיע מהקומפוננטה האב
}) {
  //const [selectedItemId, setSelectedItemId] = useState(null);
  const [newItemType, setNewItemType] = useState("seat");
  const [hoveredZoneId, setHoveredZoneId] = useState(null);
  const [newItemPlacement, setNewItemPlacement] = useState(mapZones[0].id);
  const [draggingItemId, setDraggingItemId] = useState(null);

  const mapRef = useRef(null);
  const selectedItem = items.find((item) => item.seatId === selectedSeatId);

  // פונקציה להוספת פריט חדש למפה
  const addItem = () => {
    const zone = mapZones.find((z) => z.id === newItemPlacement);
    const generatedId = `temp-${Date.now()}`;
    const newItem = {
      seatId: generatedId,
      type: newItemType,
      x: (zone.minX + zone.maxX) / 2,
      y: (zone.minY + zone.maxY) / 2,
      rotation: 0,
      status: "available",
      reservable:
        newItemType === "seat-to-add" || newItemType === "single-seat",
      location: zone.id,
    };

    setItems((prevItems) => [...prevItems, newItem]);
    onSeatSelect({
      id: generatedId,
      status: "available",
      location: newItem.location,
    });
  };

  // פונקציה למחיקת הפריט הנבחר
  const deleteItem = async () => {
    if (!selectedSeatId) return;

    if (String(selectedSeatId).startsWith("temp-")) {
      setItems((prevItems) =>
        prevItems.filter((item) => item.seatId !== selectedSeatId),
      );
      onSeatSelect(null);
      return;
    }

    if (
      window.confirm(
        "האם את בטוחה שברצונך למחוק פריט זה לצמיתות מבסיס הנתונים?",
      )
    ) {
      try {
        const response = await axios.delete(
          `http://localhost:8000/seats/delete-seat/${selectedSeatId}`,
          {
            withCredentials: true,
          },
        );
        if (response.status === 200 || response.status === 204) {
          setItems((prevItems) =>
            prevItems.filter((item) => item.seatId !== selectedSeatId),
          );
          onSeatSelect(null);
          alert("הפריט נמחק בהצלחה!");
        } else {
          alert("מחיקת הפריט נכשלה בשרת.");
        }
      } catch (error) {
        console.error("Error deleting item:", error);
        alert("אירעה שגיאה בזמן מחיקת הפריט.");
      }
    }
  };

  const toggleBlockItem = () => {
    if (!selectedSeatId) return;

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.seatId === selectedSeatId
          ? {
              ...item,
              status: item.status === "blocked" ? "available" : "blocked",
            }
          : item,
      ),
    );
  };

  const rotateSelectedItem = () => {
    if (!selectedSeatId) return;

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.seatId === selectedSeatId
          ? { ...item, rotation: ((item.rotation || 0) + 90) % 360 }
          : item,
      ),
    );
  };

  const handleItemSelect = (id) => {
    if (onSeatSelect) {
      const clickedItem = items.find((item) => item.seatId === id);
      if (clickedItem) {
        onSeatSelect({
          id: clickedItem.seatId, // 💡 כאן את שולחת מפתח שנקרא id
          status: clickedItem.status,
          location: clickedItem.location,
        });
      }
    }
  };
  const getMapPercentPosition = (clientX, clientY) => {
    if (!mapRef.current) return null;

    const rect = mapRef.current.getBoundingClientRect();
    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;

    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    };
  };

  const handleMapMouseMove = (event) => {
    const position = getMapPercentPosition(event.clientX, event.clientY);
    if (!position) return;

    const hoveredZone = getZoneByPosition(position.x, position.y);
    setHoveredZoneId(hoveredZone?.id || null);

    if (draggingItemId) {
      const currentItem = items.find((item) => item.seatId === draggingItemId);
      if (!currentItem) return;

      const allowedZone = mapZones.find(
        (zone) => zone.id === currentItem.location,
      );
      let targetX = position.x;
      let targetY = position.y;

      if (allowedZone) {
        targetX = Math.max(
          allowedZone.minX,
          Math.min(allowedZone.maxX, targetX),
        );
        targetY = Math.max(
          allowedZone.minY,
          Math.min(allowedZone.maxY, targetY),
        );
      } else {
        if (!isInsideAllowedZone(position.x, position.y)) return;
      }

      setItems((prevItems) =>
        prevItems.map((item) =>
          item.seatId === draggingItemId
            ? { ...item, x: targetX, y: targetY }
            : item,
        ),
      );
    }
  };

  const handleMapMouseUp = () => {
    setDraggingItemId(null);
  };

  const updateItemPosition = (id, clientX, clientY) => {
    const position = getMapPercentPosition(clientX, clientY);
    if (!position) return;

    if (!isInsideAllowedZone(position.x, position.y)) return;

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.seatId === id ? { ...item, x: position.x, y: position.y } : item,
      ),
    );
  };

  const saveMap = async () => {
    const itemsToSave = items.map((item) => ({
      ...item,
      seatId: String(item.seatId).startsWith("temp-") ? null : item.seatId,
    }));

    try {
      const response = await axios.post(
        "http://localhost:8000/seats/save-map",
        itemsToSave,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        },
      );

      if (response.status === 201 || response.status === 200) {
        alert("Map saved successfully!");
        onSeatSelect(null);
        // 💡 קורא לפונקציית הטעינה שעוברת מהרכיב האב ומעדכנת את הסטייט הראשי
        if (fetchLatestSeats) {
          await fetchLatestSeats();
        }
      } else {
        alert("Failed to save map. Please try again.");
      }
    } catch (error) {
      console.error("Error saving map:", error);
      alert("An error occurred while saving the map. Please try again.");
    }
  };

  return (
    <div className="dynamicMapWrapper">
      {isLibrarian && (
        <MapToolbar
          newItemType={newItemType}
          onChangeType={setNewItemType}
          newItemPlacement={newItemPlacement}
          onChangePlacement={setNewItemPlacement}
          mapZones={mapZones}
          onAdd={addItem}
          onDelete={deleteItem}
          onToggleBlock={toggleBlockItem}
          onRotate={rotateSelectedItem}
          hasSelectedItem={Boolean(selectedSeatId)}
          saveMap={saveMap}
        />
      )}

      <div
        className="dynamicMapCanvas"
        ref={mapRef}
        onPointerMove={handleMapMouseMove}
        onPointerUp={handleMapMouseUp}
        onPointerLeave={() => {
          setHoveredZoneId(null);
          handleMapMouseUp();
        }}
      >
        <img
          src="/images/library-map.png"
          alt="Library map"
          className="dynamicMapBackground"
        />

        {mapZones.map((zone) => (
          <div
            key={zone.id}
            className={`mapZoneLabel ${hoveredZoneId === zone.id ? "hiddenZoneLabel" : ""}`}
            style={{ left: `${zone.labelX}%`, top: `${zone.labelY}%` }}
          >
            {zone.label}
          </div>
        ))}

        {/* לולאת הרינדור של הרהיטים - נקייה מכפילויות של אלמנטים מיותרים */}
        {items.map((item) => {
          const isTable = item.type === "table-4" || item.type === "table-8";
          const zIndexStyle = isTable ? 2 : 1;
          const isSeatClickable = isLibrarian || !isTable;

          return (
            <div
              key={item.seatId}
              style={{
                position: "absolute",
                zIndex: zIndexStyle,
                left: 0,
                top: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            >
              {/* 💡 ה-pointerEvents מועבר ישירות כפרופ ל-MapItem, שמחיל אותו על ה-div הראשי שלו */}
              <MapItem
                item={item}
                isSelected={selectedSeatId === item.seatId}
                onSelect={handleItemSelect}
                onMove={updateItemPosition}
                isLibrarian={isLibrarian}
                setDraggingItemId={setDraggingItemId}
                isClickable={isSeatClickable} // 💡 שולח את היכולת ללחוץ על הכיסא בהתאם למנהל או סוג הרהיט
              />
            </div>
          );
        })}
      </div>

      {isLibrarian && selectedItem && (
        <div className="mapEditPanel">
          <strong>Selected:</strong> {selectedItem.type}
          <p>
            X: {Math.round(selectedItem.x)}%{" | "}
            Y: {Math.round(selectedItem.y)}%{" | "}
            Rotation: {selectedItem.rotation || 0}°{" | "}
            Status: {selectedItem.status}
          </p>
          <p>Drag the item with the mouse to reposition it.</p>
        </div>
      )}
    </div>
  );
}
