/*
  MapToolbar.jsx
  --------------
  סרגל פעולות לספרן לניהול המפה.
*/

export default function MapToolbar({
  newItemType,
  onChangeType,
  onAdd,
  onDelete,
  onToggleBlock,
  hasSelectedItem,
}) {
  return (
    <div className="mapToolbar">
      <select
        value={newItemType}
        onChange={(event) => onChangeType(event.target.value)}
      >
        <option value="single-seat">Single Seat</option>
        <option value="table-4">Table 4 Seats</option>
        <option value="table-8">Table 8 Seats</option>
        <option value="computer-seat">Computer Seat</option>
        <option value="reception">Reception</option>
      </select>

      <button type="button" onClick={onAdd}>
        Add
      </button>

      <button type="button" onClick={onToggleBlock} disabled={!hasSelectedItem}>
        Block / Unblock
      </button>

      <button type="button" onClick={onDelete} disabled={!hasSelectedItem}>
        Delete
      </button>
    </div>
  );
}
