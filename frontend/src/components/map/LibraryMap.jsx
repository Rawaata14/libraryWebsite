/*
  LibraryMap.jsx
  --------------
  מפת ספרייה דינמית עם Drag & Drop.
*/

import { useState, useRef } from "react";
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

  const mapRef = useRef(null);

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

  const updateItemPosition = (id, clientX, clientY) => {
    if (!mapRef.current) return;

    const rect = mapRef.current.getBoundingClientRect();

    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;

    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id
          ? {
              ...item,
              x,
              y,
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
          onAdd={addItem}
          onDelete={deleteItem}
          onToggleBlock={toggleBlockItem}
          hasSelectedItem={Boolean(selectedItemId)}
        />
      )}

      <div className="dynamicMapCanvas" ref={mapRef}>
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
            onMove={updateItemPosition}
            isLibrarian={isLibrarian}
          />
        ))}
      </div>

      {isLibrarian && selectedItem && (
        <div className="mapEditPanel">
          <strong>Selected:</strong> {selectedItem.type}
          <p>
            X: {Math.round(selectedItem.x)}% | Y: {Math.round(selectedItem.y)}%
            | Status: {selectedItem.status}
          </p>
          <p style={{ marginTop: "10px" }}>
            Drag the item with the mouse to reposition it.
          </p>
        </div>
      )}
    </div>
  );
}
