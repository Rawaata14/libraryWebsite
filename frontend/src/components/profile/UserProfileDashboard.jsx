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
=========================================================
*/

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

  const [stats, setStats] = useState({
    borrowedBooks: 0,
    activeReservations: 0,
    unreadNotifications: 0,
  });

  const [upcomingReservations, setUpcomingReservations] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  /*
  ---------------------------------------------------------
  fetchDashboardStats

  תפקיד:
  טוען מהשרת את הסטטיסטיקות ואת ההזמנות העתידיות
  של המשתמש המחובר.
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
        unreadNotifications: Number(dashboardStats.unreadNotifications) || 0,
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
        unreadNotifications: 0,
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

  תפקיד:
  טוען את נתוני המשתמש כאשר הקומפוננטה עולה.
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

      {/* ===== סיכום המשתמש ===== */}

      <section className="dashboardBlock">
        <h3 className="dashboardBlockTitle">My Summary</h3>

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

          <div className="dashboardStatCard">
            <span className="dashboardStatIcon" aria-hidden="true">
              🔔
            </span>

            <div>
              <h4>{stats.unreadNotifications}</h4>
              <p>Unread Notifications</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ההזמנות הקרובות ===== */}

      <section className="dashboardBlock">
        <h3 className="dashboardBlockTitle">Upcoming Reservations</h3>

        <div className="userReservationsList">
          {isLoading ? (
            <p className="dashboardEmptyText" role="status">
              Loading reservations...
            </p>
          ) : upcomingReservations.length > 0 ? (
            upcomingReservations.map((reservation) => (
              <div
                key={reservation.reservationId}
                className="userReservationItem"
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

      {/* ===== פעולות מהירות ===== */}

      <section className="dashboardBlock">
        <h3 className="dashboardBlockTitle">Quick Actions</h3>

        <div className="profileGrid">
          <button
            type="button"
            className="profileBox profileActionButton"
            onClick={() => navigate("/map")}
          >
            <h3>🪑 Study Rooms</h3>
            <p>Reserve a study seat or room</p>
          </button>

          <button
            type="button"
            className="profileBox profileActionButton"
            onClick={() => navigate("/books")}
          >
            <h3>📖 Books</h3>
            <p>Browse and reserve books</p>
          </button>

          <button
            type="button"
            className="profileBox profileActionButton"
            onClick={() => navigate("/my-reservations")}
          >
            <h3>📅 My Reservations</h3>
            <p>View your active reservations</p>
          </button>

          <button
            type="button"
            className="profileBox profileActionButton"
            onClick={() => navigate("/my-messages")}
          >
            <h3>✉️ My Messages</h3>
            <p>View messages and replies from the library</p>
          </button>
        </div>
      </section>
    </div>
  );
}
