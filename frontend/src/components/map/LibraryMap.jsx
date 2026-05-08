/*
  LibraryMap.jsx
  --------------
  מפת ספרייה דינמית.

  אחריות:
  - הצגת תמונת רקע קבועה של המפה
  - הצגת אייקונים מעל המפה
  - ניהול הוספה, מחיקה, חסימה והזזה של מקומות
*/

import { useState } from "react";
import MapItem from "./MapItem";
import MapToolbar from "./MapToolbar";

const initialItems = [
  {
    id: "1",
    type: "single-seat",
    x: 18,
    y: 35,
    status: "available",
  },
  {
    id: "2",
    type: "table-4",
    x: 30,
    y: 45,
    status: "available",
  },
];

export default function LibraryMap({ isLibrarian = true }) {
  const [items, setItems] = useState(initialItems);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [newItemType, setNewItemType] = useState("single-seat");

  const selectedItem = items.find((item) => item.id === selectedItemId);

  const addItem = () => {
    const newItem = {
      id: Date.now().toString(),
      type: newItemType,
      x: 50,
      y: 50,
      status: "available",
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

  const moveItem = (direction) => {
    if (!selectedItemId) return;

    const step = 2;

    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== selectedItemId) return item;

        if (direction === "up") {
          return { ...item, y: Math.max(0, item.y - step) };
        }

        if (direction === "down") {
          return { ...item, y: Math.min(100, item.y + step) };
        }

        if (direction === "left") {
          return { ...item, x: Math.max(0, item.x - step) };
        }

        if (direction === "right") {
          return { ...item, x: Math.min(100, item.x + step) };
        }

        return item;
      }),
    );
  };

  return (
    <div className="dynamicMapWrapper">
      {isLibrarian && (
        <MapToolbar
          newItemType={newItemType}
          onChangeType={setNewItemType}
          onAdd={addItem}
          onDelete={deleteItem}
          onToggleBlock={toggleBlockItem}
          hasSelectedItem={Boolean(selectedItemId)}
        />
      )}

      <div className="dynamicMapCanvas">
        <img
          src="/images/library-map.png"
          alt="Library map"
          className="dynamicMapBackground"
        />

        {items.map((item) => (
          <MapItem
            key={item.id}
            item={item}
            isSelected={selectedItemId === item.id}
            onSelect={setSelectedItemId}
          />
        ))}
      </div>

      {isLibrarian && selectedItem && (
        <div className="mapEditPanel">
          <strong>Selected:</strong> {selectedItem.type}
          <div className="mapMoveButtons">
            <button type="button" onClick={() => moveItem("up")}>
              ↑
            </button>
            <button type="button" onClick={() => moveItem("left")}>
              ←
            </button>
            <button type="button" onClick={() => moveItem("right")}>
              →
            </button>
            <button type="button" onClick={() => moveItem("down")}>
              ↓
            </button>
          </div>
          <p>
            X: {selectedItem.x}% | Y: {selectedItem.y}% | Status:{" "}
            {selectedItem.status}
          </p>
        </div>
      )}
    </div>
  );
}
