/*
  LibraryMap.jsx
  =========================================================

  קומפוננטת המפה הראשית של הספרייה.

  אחריות:
  ---------------------------------------------------------
  ✔ הצגת תמונת הרקע של הספרייה
  ✔ הצגת אייקונים של שולחנות וכיסאות
  ✔ Drag & Drop
  ✔ סיבוב אובייקטים
  ✔ חסימת אובייקטים
  ✔ מחיקת אובייקטים
  ✔ כותרות שקופות לחדרים
  ✔ הסתרת כותרת כאשר העכבר נמצא בתוך אותו אזור
  ✔ מניעת גרירה על קירות ומדפים

  =========================================================
*/

import { useRef, useState } from "react";

import MapItem from "./MapItem";
import MapToolbar from "./MapToolbar";

const initialItems = [];

const mapZones = [
  {
    id: "quiet-room",
    label: "Quiet Room",
    minX: 3, // גבול שמאלי
    maxX: 34, // גבול ימני
    minY: 16, // גבול עליון
    maxY: 47, // גבול תחתון
    labelX: 18,
    labelY: 8,
  },
  {
    id: "computer-area",
    label: "Computer Area",
    minX: 38, // גבול שמאלי
    maxX: 61, // גבול ימני
    minY: 16, // גבול עליון
    maxY: 42, // גבול תחתון
    labelX: 49,
    labelY: 8,
  },
  {
    id: "group-room",
    label: "Group Study Rooms",
    minX: 65, // גבול שמאלי
    maxX: 97, // גבול ימני
    minY: 16, // גבול עליון
    maxY: 50, // גבול תחתון
    labelX: 81,
    labelY: 8,
  },
  {
    id: "reading-nook",
    label: "Reading Book",
    minX: 2, // גבול שמאלי
    maxX: 18, // גבול ימני
    minY: 51, // גבול עליון
    maxY: 80, // גבול תחתון
    labelX: 18,
    labelY: 57,
  },
  {
    id: "study-room-1",
    label: "Study Room 1",
    minX: 49, // גבול שמאלי
    maxX: 63.5, // גבול ימני
    minY: 54, // גבול עליון
    maxY: 80, // גבול תחתון
    labelX: 57,
    labelY: 57,
  },
  {
    id: "study-room-2",
    label: "Study Room 2",
    minX: 65, // גבול שמאלי
    maxX: 79.5, // גבול ימני
    minY: 54, // גבול עליון
    maxY: 80, // גבול תחתון
    labelX: 72,
    labelY: 57,
  },
  {
    id: "study-room-3",
    label: "Study Room 3",
    minX: 81.5, // גבול שמאלי
    maxX: 98, // גבול ימני
    minY: 54, // גבול עליון
    maxY: 80, // גבול תחתון
    labelX: 89,
    labelY: 57,
  },
];

const isInsideAllowedZone = (x, y) => {
  return mapZones.some(
    (zone) =>
      x >= zone.minX && x <= zone.maxX && y >= zone.minY && y <= zone.maxY,
  );
};

const getZoneByPosition = (x, y) => {
  return mapZones.find(
    (zone) =>
      x >= zone.minX && x <= zone.maxX && y >= zone.minY && y <= zone.maxY,
  );
};

export default function LibraryMap({ isLibrarian = true }) {
  const [items, setItems] = useState(initialItems);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [newItemType, setNewItemType] = useState("seat");
  const [hoveredZoneId, setHoveredZoneId] = useState(null);
  const [newItemPlacement, setNewItemPlacement] = useState(mapZones[0].id); // ברירת מחדל לאזור הראשון ברשימה
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });

  const mapRef = useRef(null);

  const selectedItem = items.find((item) => item.id === selectedItemId);

  const addItem = () => {
    const zone = mapZones.find((z) => z.id === newItemPlacement);

    const newItem = {
      id: Date.now().toString(),
      type: newItemType,
      x: (zone.minX + zone.maxX) / 2,
      y: (zone.minY + zone.maxY) / 2,
      rotation: 0,
      status: "available",
      reservable: newItemType === "seat" || newItemType === "single-seat",
    };

    setItems((prevItems) => [...prevItems, newItem]);
    setSelectedItemId(newItem.id);
  };

  const deleteItem = () => {
    if (!selectedItemId) return;

    setItems((prevItems) =>
      prevItems.filter((item) => item.id !== selectedItemId),
    );

    setSelectedItemId(null);
  };

  const toggleBlockItem = () => {
    if (!selectedItemId) return;

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === selectedItemId
          ? {
              ...item,
              status: item.status === "blocked" ? "available" : "blocked",
            }
          : item,
      ),
    );
  };

  const rotateSelectedItem = () => {
    if (!selectedItemId) return;

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === selectedItemId
          ? {
              ...item,
              rotation: ((item.rotation || 0) + 90) % 360,
            }
          : item,
      ),
    );
  };

  const getMapPercentPosition = (clientX, clientY) => {
    if (!mapRef.current) return null;

    const rect = mapRef.current.getBoundingClientRect();

    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;

    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    return { x, y };
  };

  const handleMapMouseMove = (event) => {
    const position = getMapPercentPosition(event.clientX, event.clientY);

    if (!position) return;
    //setMouseCoords({ x: Math.round(position.x), y: Math.round(position.y) });

    const hoveredZone = getZoneByPosition(position.x, position.y);

    setHoveredZoneId(hoveredZone?.id || null);
  };

  const updateItemPosition = (id, clientX, clientY) => {
    const position = getMapPercentPosition(clientX, clientY);

    if (!position) return;

    if (!isInsideAllowedZone(position.x, position.y)) {
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id
          ? {
              ...item,
              x: position.x,
              y: position.y,
            }
          : item,
      ),
    );
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
          hasSelectedItem={Boolean(selectedItemId)}
        />
      )}

      <div
        className="dynamicMapCanvas"
        ref={mapRef}
        onMouseMove={handleMapMouseMove}
        onMouseLeave={() => setHoveredZoneId(null)}
      >
        <img
          src="/images/library-map.png"
          alt="Library map"
          className="dynamicMapBackground"
        />

        {mapZones.map((zone) => (
          <div
            key={zone.id}
            className={`mapZoneLabel ${
              hoveredZoneId === zone.id ? "hiddenZoneLabel" : ""
            }`}
            style={{
              left: `${zone.labelX}%`,
              top: `${zone.labelY}%`,
            }}
          >
            {zone.label}
          </div>
        ))}

        {items.map((item) => (
          <MapItem
            key={item.id}
            item={item}
            isSelected={selectedItemId === item.id}
            onSelect={setSelectedItemId}
            onMove={updateItemPosition}
            isLibrarian={isLibrarian}
          />
        ))}
      </div>
      {/* תיבת פיתוח זמנית להצגת קואורדינטות העכבר
      <div
        style={{
          position: "fixed",
          top: "10px",
          left: "10px",
          background: "black",
          color: "lime",
          padding: "10px",
          fontFamily: "monospace",
          zIndex: 9999,
          borderRadius: "5px",
          border: "1px solid lime",
        }}
      >
        Mouse Position: X: {mouseCoords.x}% | Y: {mouseCoords.y}%
      </div> */}
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
