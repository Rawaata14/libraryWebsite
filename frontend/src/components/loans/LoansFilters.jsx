/*
=========================================================
LoansFilters.jsx

תיאור הקובץ:
מציג את כלי החיפוש והסינון של רשימת ההשאלות עבור הספרן.

הקומפוננטה כוללת:
- חיפוש לפי כותרת ספר או שם משתמש.
- סינון לפי סטטוס ההשאלה (פעיל, מאחר, הוחזר וכו').

הקומפוננטה אינה שומרת state פנימי.
=========================================================
*/

import PropTypes from "prop-types";

export default function LoansFilters({
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
        placeholder="Search by book title or user name..."
        aria-label="Search loans"
      />

      <select
        value={statusFilter}
        onChange={(event) => onStatusChange(event.target.value)}
        aria-label="Filter loans by status"
      >
        <option value="all">All Statuses</option>
        <option value="active">Active</option>
        <option value="late">Overdue / Late</option>
        <option value="returned">Returned</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>
  );
}

/*
---------------------------------------------------------
LoansFilters.propTypes

תפקיד:
מגדיר את ערכי הסינון ואת פעולות שינוי החיפוש והסטטוס עבור השאלות.
---------------------------------------------------------
*/
LoansFilters.propTypes = {
  searchText: PropTypes.string.isRequired,
  statusFilter: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
};
