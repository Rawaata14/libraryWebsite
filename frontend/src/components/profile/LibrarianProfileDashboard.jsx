/*
=========================================================
LibrarianProfileDashboard.jsx

תיאור הקובץ:
דשבורד הספרנית המוצג בתוך דף הפרופיל.

הקובץ כולל:
- הצגת נתוני הספרייה המרכזיים.
- הצגת הפעילות היומית האחרונה.
- קישורים נגישים לדפי הניהול.

כל הנתונים מתקבלים דרך:
useLibrarianDashboard
=========================================================
*/

import { NavLink } from "react-router-dom";

import useLibrarianDashboard from "../../hooks/useLibrarianDashboard";

/*
---------------------------------------------------------
LibrarianProfileDashboard

תפקיד:
מציגה לספרנית מרכז בקרה בפרופיל באמצעות
מקור הנתונים המשותף של הדשבורד.
---------------------------------------------------------
*/
export default function LibrarianProfileDashboard() {
  const { stats, isLoading, errorMessage, fetchDashboardStats } =
    useLibrarianDashboard();

  if (isLoading) {
    return (
      <div className="profileSection">
        <h2>Librarian Dashboard</h2>

        <p role="status">Loading dashboard data...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="profileSection">
        <h2>Librarian Dashboard</h2>

        <div className="errorMessage" role="alert">
          <p>{errorMessage}</p>

          <button type="button" onClick={fetchDashboardStats}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profileSection">
      <div className="profileDashboardHeading">
        <h2>Librarian Dashboard</h2>

        <button
          type="button"
          className="profileDashboardRefreshButton"
          onClick={fetchDashboardStats}
        >
          Refresh Data
        </button>
      </div>

      {/*
      ===================================================
      נתונים חשובים
      ===================================================
      */}

      <section
        className="dashboardBlock"
        aria-labelledby="important-updates-title"
      >
        <h3 id="important-updates-title" className="dashboardBlockTitle">
          Important Updates
        </h3>

        <div className="dashboardStatCard">
          <span className="dashboardStatIcon" aria-hidden="true">
            📅
          </span>

          <div>
            <h4>{stats.todayReservations}</h4>
            <p>Today&apos;s Reservations</p>
          </div>
        </div>

        <div className="dashboardStatsGrid">
          <div className="dashboardStatCard">
            <span className="dashboardStatIcon" aria-hidden="true">
              📚
            </span>

            <div>
              <h4>{stats.activeLoans}</h4>
              <p>Active Loans</p>
            </div>
          </div>

          <div className="dashboardStatCard">
            <span className="dashboardStatIcon" aria-hidden="true">
              ⏰
            </span>

            <div>
              <h4>{stats.overdueBooks}</h4>
              <p>Overdue Books</p>
            </div>
          </div>

          <div className="dashboardStatCard">
            <span className="dashboardStatIcon" aria-hidden="true">
              ✉️
            </span>

            <div>
              <h4>{stats.unreadMessages}</h4>
              <p>Unread Messages</p>
            </div>
          </div>

          <div className="dashboardStatCard">
            <span className="dashboardStatIcon" aria-hidden="true">
              🪑
            </span>

            <div>
              <h4>{stats.blockedSeats}</h4>
              <p>Blocked Seats</p>
            </div>
          </div>
        </div>
      </section>

      {/*
      ===================================================
      פעילות היום
      ===================================================
      */}

      <section
        className="dashboardBlock"
        aria-labelledby="today-activity-title"
      >
        <h3 id="today-activity-title" className="dashboardBlockTitle">
          Today&apos;s Activity
        </h3>

        <div className="dashboardActivityList">
          {stats.todayActivity.length > 0 ? (
            stats.todayActivity.map((activity, index) => (
              <div
                key={`${activity}-${index}`}
                className="dashboardActivityItem"
              >
                <span aria-hidden="true">•</span>
                <p>{activity}</p>
              </div>
            ))
          ) : (
            <p className="dashboardEmptyText">No activity today.</p>
          )}
        </div>
      </section>

      {/*
      ===================================================
      קישורי ניהול מהירים
      ===================================================
      */}

      <section
        className="dashboardBlock"
        aria-labelledby="quick-management-title"
      >
        <h3 id="quick-management-title" className="dashboardBlockTitle">
          Quick Management
        </h3>

        <NavLink className="profileBox" to="/admin/reservations">
          <h3>📅 Manage Reservations</h3>
          <p>View reservations and handle exceptional cancellations</p>
        </NavLink>

        <div className="profileGrid librarianProfileGrid">
          <NavLink className="profileBox" to="/admin/books">
            <h3>📖 Manage Books</h3>
            <p>View, add, edit and remove books</p>
          </NavLink>

          <NavLink className="profileBox" to="/admin/map">
            <h3>🪑 Manage Seats</h3>
            <p>Control library map and seating areas</p>
          </NavLink>

          <NavLink className="profileBox" to="/admin/users">
            <h3>👥 Users Management</h3>
            <p>Manage readers and librarians</p>
          </NavLink>

          <NavLink className="profileBox" to="/reports">
            <h3>📊 Reports</h3>
            <p>View library statistics and reports</p>
          </NavLink>

          <NavLink className="profileBox" to="/messages">
            <h3>✉️ Messages</h3>
            <p>View messages from users</p>
          </NavLink>
        </div>
      </section>
    </div>
  );
}
