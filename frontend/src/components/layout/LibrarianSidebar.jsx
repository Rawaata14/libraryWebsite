/*
=========================================================
LibrarianSidebar.jsx

תיאור הקובץ:
סרגל ניווט אנכי עבור הספרנית.

הסרגל כולל:
- קישור לדשבורד הספרנית.
- נתונים מרכזיים מהדשבורד.
- קישורים לדפי הניהול.
- כפתור לרענון הנתונים.
=========================================================
*/

import { NavLink } from "react-router-dom";

import useLibrarianDashboard from "../../hooks/useLibrarianDashboard";

import "../../styles/librarian-sidebar.css";

/*
---------------------------------------------------------
LibrarianSidebar

תפקיד:
מציג לספרנית סרגל אנכי עם נתונים
וקישורים לפעולות הניהול המרכזיות.
---------------------------------------------------------
*/
export default function LibrarianSidebar() {
  const { stats, isLoading, errorMessage, fetchDashboardStats } =
    useLibrarianDashboard();

  const navClassName = ({ isActive }) =>
    isActive
      ? "librarianSidebarLink activeSidebarLink"
      : "librarianSidebarLink";

  return (
    <aside className="librarianSidebar" aria-label="Librarian navigation">
      <NavLink to="/admin/librarian" className="librarianSidebarDashboardLink">
        📊 Dashboard
      </NavLink>

      <div className="librarianSidebarDivider" />

      <div className="librarianSidebarStats">
        {isLoading ? (
          <p className="librarianSidebarMessage">Loading statistics...</p>
        ) : errorMessage ? (
          <p className="librarianSidebarError">Statistics unavailable</p>
        ) : (
          <>
            <div className="librarianSidebarStat">
              <span>📅 Today</span>
              <strong>{stats.todayReservations}</strong>
            </div>

            <div className="librarianSidebarStat">
              <span>📚 Active Loans</span>
              <strong>{stats.activeLoans}</strong>
            </div>

            <div className="librarianSidebarStat">
              <span>⚠️ Overdue</span>
              <strong>{stats.overdueBooks}</strong>
            </div>

            <div className="librarianSidebarStat">
              <span>✉️ Messages</span>
              <strong>{stats.unreadMessages}</strong>
            </div>

            <div className="librarianSidebarStat">
              <span>🚫 Blocked Seats</span>
              <strong>{stats.blockedSeats}</strong>
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        className="librarianSidebarRefresh"
        onClick={fetchDashboardStats}
        disabled={isLoading}
      >
        {isLoading ? "Refreshing..." : "Refresh Data"}
      </button>

      <div className="librarianSidebarDivider" />

      <nav className="librarianSidebarNavigation">
        <NavLink to="/admin/reservations" className={navClassName}>
          📅 Manage Reservations
        </NavLink>

        {/*
          קישור לניהול רשימות ההמתנה של ספרים
          ושל מקומות ישיבה.

          הספרנית יכולה לראות:
          - מי ממתין.
          - מיקום בתור.
          - מצב ההמתנה.
          - הצעות פעילות והצעות שפג תוקפן.
        */}
        <NavLink to="/admin/waiting-lists" className={navClassName}>
          ⏳ Manage Waiting Lists
        </NavLink>

        <NavLink to="/admin/books" className={navClassName}>
          📖 Manage Books
        </NavLink>

        <NavLink to="/admin/add-book" className={navClassName}>
          ➕ Add Book
        </NavLink>

        <NavLink to="/admin/map" className={navClassName}>
          🪑 Edit Library Map
        </NavLink>

        <NavLink to="/admin/users" className={navClassName}>
          👥 Manage Users
        </NavLink>

        <NavLink to="/messages" className={navClassName}>
          ✉️ Messages
        </NavLink>

        <NavLink to="/reports" className={navClassName}>
          📈 Reports
        </NavLink>
      </nav>
    </aside>
  );
}
