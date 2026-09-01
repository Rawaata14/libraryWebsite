/*
=========================================================
UserProfileDashboard.jsx

תיאור הקובץ:
מציג את דשבורד המשתמש הרגיל.

הדשבורד כולל:
- מספר ספרים מושאלים.
- מספר הזמנות פעילות.
- מספר התראות שלא נקראו.
- רשימת ההזמנות העתידיות.
- קישורים לפעולות נפוצות.

מונה ההתראות מתקבל מ-NotificationContext,
כדי שיתעדכן מיד לאחר קריאת התראה.
=========================================================
*/

import { useCallback, useContext, useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { NotificationContext } from "../../context/NotificationContext";

import { getUserDashboardStats } from "../../services/dashboardService";

import {
  formatReservationDate,
  formatReservationTime,
  getStatusLabel,
} from "../../utils/reservationUtils";

/*
---------------------------------------------------------
UserProfileDashboard

תפקיד:
טוען ומציג את נתוני הדשבורד של המשתמש המחובר.
---------------------------------------------------------
*/
export default function UserProfileDashboard() {
  const navigate = useNavigate();

  const { unreadCount } = useContext(NotificationContext);

  const [stats, setStats] = useState({
    borrowedBooks: 0,
    activeReservations: 0,
  });

  const [upcomingReservations, setUpcomingReservations] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState("");

  /*
  ---------------------------------------------------------
  fetchDashboardStats

  תפקיד:
  טוען מהשרת את הסטטיסטיקות ואת ההזמנות
  העתידיות של המשתמש המחובר.

  ההתראות אינן נטענות כאן. הן מתקבלות דרך
  NotificationContext המשותף לכל האפליקציה.
  ---------------------------------------------------------
  */
  const fetchDashboardStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError("");

      const response = await getUserDashboardStats();

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to load dashboard information",
        );
      }

      const dashboardStats = response.data.stats || {};

      setStats({
        borrowedBooks: Number(dashboardStats.borrowedBooks) || 0,

        activeReservations: Number(dashboardStats.activeReservations) || 0,
      });

      setUpcomingReservations(
        Array.isArray(dashboardStats.upcomingReservations)
          ? dashboardStats.upcomingReservations
          : [],
      );
    } catch (error) {
      console.error("User dashboard stats error:", error);

      setStats({
        borrowedBooks: 0,
        activeReservations: 0,
      });

      setUpcomingReservations([]);

      setLoadError(
        error.message || "An error occurred while loading the dashboard.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  /*
  ---------------------------------------------------------
  טעינת נתוני הדשבורד
  ---------------------------------------------------------
  */
  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  return (
    <div className="profileSection">
      <h2>User Dashboard</h2>

      {loadError && (
        <div className="dashboardLoadError" role="alert">
          {loadError}

          <button type="button" onClick={fetchDashboardStats}>
            Try Again
          </button>
        </div>
      )}

      {/*
      ===================================================
      סיכום המשתמש
      ===================================================
      */}
      <section
        className="dashboardBlock"
        aria-labelledby={"user-summary-title"}
      >
        <h3 id="user-summary-title" className="dashboardBlockTitle">
          My Summary
        </h3>

        <div className="dashboardStatsGrid">
          <div className="dashboardStatCard">
            <span className="dashboardStatIcon" aria-hidden="true">
              📚
            </span>

            <div>
              <h4>{stats.borrowedBooks}</h4>

              <p>Borrowed Books</p>
            </div>
          </div>

          <div className="dashboardStatCard">
            <span className="dashboardStatIcon" aria-hidden="true">
              📅
            </span>

            <div>
              <h4>{stats.activeReservations}</h4>

              <p>Active Reservations</p>
            </div>
          </div>

          {/*
          כרטיס ההתראות הוא כפתור שמוביל לדף
          ההתראות המלא.
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
      ההזמנות הקרובות
      ===================================================
      */}
      <section
        className="dashboardBlock"
        aria-labelledby={"upcoming-reservations-title"}
      >
        <h3 id="upcoming-reservations-title" className="dashboardBlockTitle">
          Upcoming Reservations
        </h3>

        <div className="userReservationsList">
          {isLoading ? (
            <p className="dashboardEmptyText" role="status">
              Loading reservations...
            </p>
          ) : upcomingReservations.length > 0 ? (
            upcomingReservations.map((reservation) => (
              <div
                key={reservation.reservationId}
                className={"userReservationItem"}
              >
                <div>
                  <strong>Seat {reservation.seatId}</strong>

                  <p>
                    {formatReservationDate(reservation.reservationDate)}

                    {" | "}

                    {formatReservationTime(reservation.startTime)}

                    {" - "}

                    {formatReservationTime(reservation.endTime)}
                  </p>
                </div>

                <span
                  className={`reservationStatus ${reservation.status || ""}`}
                >
                  {getStatusLabel(reservation.status)}
                </span>
              </div>
            ))
          ) : (
            <p className="dashboardEmptyText">No upcoming reservations.</p>
          )}
        </div>
      </section>

      {/*
      ===================================================
      פעולות מהירות
      ===================================================
      */}
      <section
        className="dashboardBlock"
        aria-labelledby={"user-quick-actions-title"}
      >
        <h3 id="user-quick-actions-title" className="dashboardBlockTitle">
          Quick Actions
        </h3>

        <div className="profileGrid">
          <button
            type="button"
            className={"profileBox profileActionButton"}
            onClick={() => navigate("/map")}
          >
            <h3>🪑 Study Rooms</h3>

            <p>Reserve a study seat or room</p>
          </button>

          <button
            type="button"
            className={"profileBox profileActionButton"}
            onClick={() => navigate("/books")}
          >
            <h3>📖 Books</h3>

            <p>Browse and reserve books</p>
          </button>

          <button
            type="button"
            className={"profileBox profileActionButton"}
            onClick={() => navigate("/my-reservations")}
          >
            <h3>📅 My Reservations</h3>

            <p>View your active reservations</p>
          </button>

          {/*
            כפתור מעבר לרשימות ההמתנה האישיות.

            בדף זה המשתמש יכול:
            - לראות את מיקומו בתור.
            - לראות אם התקבלה הצעה.
            - לבדוק את זמן פקיעת ההצעה.
            - לעזוב רשימת המתנה פעילה.
          */}
          <button
            type="button"
            className={"profileBox profileActionButton"}
            onClick={() => navigate("/my-waiting-lists")}
          >
            <h3>⏳ My Waiting Lists</h3>

            <p>Track book and seat waiting-list positions</p>
          </button>

          <button
            type="button"
            className={"profileBox profileActionButton"}
            onClick={() => navigate("/my-messages")}
          >
            <h3>✉️ My Messages</h3>

            <p>View messages and replies from the library</p>
          </button>

          <button
            type="button"
            className={"profileBox profileActionButton"}
            onClick={() => navigate("/notifications")}
          >
            <h3>🔔 Notifications</h3>

            <p>View library updates and unread notifications</p>
          </button>
        </div>
      </section>
    </div>
  );
}
