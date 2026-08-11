/*
=========================================================
ReservationFilters.jsx

תיאור הקובץ:
מציג את כלי החיפוש והסינון של רשימת ההזמנות.

הקומפוננטה כוללת:
- חיפוש לפי שם משתמש, אימייל, מספר כיסא
  או מזהה הזמנה.
- סינון לפי סטטוס ההזמנה.

הקומפוננטה אינה שומרת state פנימי.
=========================================================
*/

export default function ReservationFilters({
  searchText,
  statusFilter,
  onSearchChange,
  onStatusChange,
}) {
  return (
    <div className="managementFilters">
      <input
        type="search"
        value={searchText}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by name, email, seat or reservation ID..."
        aria-label="Search reservations"
      />

      <select
        value={statusFilter}
        onChange={(event) => onStatusChange(event.target.value)}
        aria-label="Filter reservations by status"
      >
        <option value="all">All Statuses</option>

        <option value="occupied">Confirmed</option>

        <option value="cancelled">Cancelled</option>

        <option value="completed">Completed</option>
      </select>
    </div>
  );
}
