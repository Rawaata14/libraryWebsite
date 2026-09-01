/*
=========================================================
LibrarianProfileDashboard.jsx

תיאור הקובץ:
דשבורד הספרנית המוצג בתוך דף הפרופיל.

הקובץ כולל:
- הצגת נתוני הספרייה המרכזיים.
- הצגת מספר ההתראות שלא נקראו.
- הצגת הפעילות היומית האחרונה.
- קישורים נגישים לדפי הניהול.

נתוני הספרייה מתקבלים דרך:
useLibrarianDashboard

מונה ההתראות מתקבל דרך:
NotificationContext
=========================================================
*/

import { useContext } from "react";

import { NavLink, useNavigate } from "react-router-dom";

import { NotificationContext } from "../../context/NotificationContext";

import useLibrarianDashboard from "../../hooks/useLibrarianDashboard";

/*
---------------------------------------------------------
LibrarianProfileDashboard

תפקיד:
מציגה לספרנית מרכז בקרה בפרופיל באמצעות
מקור נתוני הדאשבורד ומקור ההתראות המשותף.
---------------------------------------------------------
*/
export default function LibrarianProfileDashboard() {
  const navigate = useNavigate();

  const { unreadCount } = useContext(NotificationContext);

  const { stats, isLoading, errorMessage, fetchDashboardStats } =
    useLibrarianDashboard();

  /*
  ---------------------------------------------------------
  מצב טעינה
  ---------------------------------------------------------
  */
  if (isLoading) {
    return (
      <div className="profileSection">
        <h2>Librarian Dashboard</h2>

        <p role="status">Loading dashboard data...</p>
      </div>
    );
  }

  /*
  ---------------------------------------------------------
  מצב שגיאה
  ---------------------------------------------------------
  */
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
          className={"profileDashboardRefreshButton"}
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
        aria-labelledby={"important-updates-title"}
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

          {/*
          כרטיס ההתראות הוא כפתור ומוביל לדף
          ההתראות המשותף.
          */}
          <button
            type="button"
            className={"dashboardStatCard dashboardStatButton"}
            onClick={() => navigate("/notifications")}
            aria-label={
              unreadCount > 0
                ? `View ${unreadCount} unread notifications`
                : "View notifications"
            }
          >
            <span className="dashboardStatIcon" aria-hidden="true">
              🔔
            </span>

            <div>
              <h4>{unreadCount}</h4>

              <p>Unread Notifications</p>
            </div>
          </button>
        </div>
      </section>

      {/*
      ===================================================
      פעילות היום
      ===================================================
      */}
      <section
        className="dashboardBlock"
        aria-labelledby={"today-activity-title"}
      >
        <h3 id="today-activity-title" className="dashboardBlockTitle">
          Today&apos;s Activity
        </h3>

        <div className="dashboardActivityList">
          {stats.todayActivity.length > 0 ? (
            stats.todayActivity.map((activity, index) => (
              <div
                key={`${activity}-${index}`}
                className={"dashboardActivityItem"}
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
        aria-labelledby={"quick-management-title"}
      >
        <h3 id="quick-management-title" className="dashboardBlockTitle">
          Quick Management
        </h3>

        <NavLink className="profileBox" to="/admin/reservations">
          <h3>📅 Manage Reservations</h3>

          <p>View reservations and handle exceptional cancellations</p>
        </NavLink>

        <div className={"profileGrid librarianProfileGrid"}>
          <NavLink className="profileBox" to="/admin/books">
            <h3>📖 Manage Books</h3>

            <p>View, add, edit and remove books</p>
          </NavLink>

          {/*
            קישור לניהול רשימות ההמתנה.

            הדף מציג לספרנית:
            - ממתינים לספרים.
            - ממתינים למקומות.
            - מיקום כל משתמש בתור.
            - הצעות פעילות.
            - הצעות שהושלמו או שפג תוקפן.
          */}
          <NavLink className="profileBox" to="/admin/waiting-lists">
            <h3>⏳ Manage Waiting Lists</h3>

            <p>Monitor book and seat queues and active offers</p>
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

          <NavLink className="profileBox" to="/notifications">
            <h3>🔔 Notifications</h3>

            <p>View library updates and unread notifications</p>
          </NavLink>
        </div>
      </section>
    </div>
  );
}
