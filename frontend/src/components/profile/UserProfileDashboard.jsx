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

import { useEffect, useState } from "react";
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
טוענת ומציגה את נתוני הדשבורד של המשתמש המחובר.
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

  /*
  ---------------------------------------------------------
  fetchDashboardStats

  תפקיד:
  טוענת מהשרת את הסטטיסטיקות ואת ההזמנות העתידיות
  של המשתמש המחובר.
  ---------------------------------------------------------
  */
  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);

      const response = await getUserDashboardStats();

      if (response.data.success) {
        const dashboardStats = response.data.stats || {};

        setStats({
          borrowedBooks: Number(dashboardStats.borrowedBooks) || 0,
          activeReservations:
            Number(dashboardStats.activeReservations) || 0,
          unreadNotifications:
            Number(dashboardStats.unreadNotifications) || 0,
        });

        setUpcomingReservations(
          Array.isArray(dashboardStats.upcomingReservations)
            ? dashboardStats.upcomingReservations
            : [],
        );
      }
    } catch (error) {
      console.error("User dashboard stats error:", error);

      setStats({
        borrowedBooks: 0,
        activeReservations: 0,
        unreadNotifications: 0,
      });

      setUpcomingReservations([]);
    } finally {
      setIsLoading(false);
    }
  };

  /*
  ---------------------------------------------------------
  טעינת נתוני הדשבורד

  תפקיד:
  טוענת את נתוני המשתמש כאשר הקומפוננטה עולה.
  ---------------------------------------------------------
  */
  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return (
    <div className="profileSection">
      <h2>User Dashboard</h2>

      <section className="dashboardBlock">
        <h3 className="dashboardBlockTitle">My Summary</h3>

        <div className="dashboardStatsGrid">
          <div className="dashboardStatCard">
            <span className="dashboardStatIcon">📚</span>

            <div>
              <h4>{stats.borrowedBooks}</h4>
              <p>Borrowed Books</p>
            </div>
          </div>

          <div className="dashboardStatCard">
            <span className="dashboardStatIcon">📅</span>

            <div>
              <h4>{stats.activeReservations}</h4>
              <p>Active Reservations</p>
            </div>
          </div>

          <div className="dashboardStatCard">
            <span className="dashboardStatIcon">🔔</span>

            <div>
              <h4>{stats.unreadNotifications}</h4>
              <p>Unread Notifications</p>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboardBlock">
        <h3 className="dashboardBlockTitle">Upcoming Reservations</h3>

        <div className="userReservationsList">
          {isLoading ? (
            <p className="dashboardEmptyText">Loading reservations...</p>
          ) : upcomingReservations.length > 0 ? (
            upcomingReservations.map((reservation) => (
              <div
                key={reservation.reservationId}
                className="userReservationItem"
              >
                <div>
                  <strong>Seat {reservation.seatId}</strong>

                  <p>
                    {formatReservationDate(
                      reservation.reservationDate,
                    )}{" "}
                    | {formatReservationTime(reservation.startTime)} -{" "}
                    {formatReservationTime(reservation.endTime)}
                  </p>
                </div>

                <span className="reservationStatus">
                  {getStatusLabel(reservation.status)}
                </span>
              </div>
            ))
          ) : (
            <p className="dashboardEmptyText">
              No upcoming reservations.
            </p>
          )}
        </div>
      </section>

      <section className="dashboardBlock">
        <h3 className="dashboardBlockTitle">Quick Actions</h3>

        <div className="profileGrid">
          <div className="profileBox" onClick={() => navigate("/map")}>
            <h3>🪑 Study Rooms</h3>
            <p>Reserve a study seat or room</p>
          </div>

          <div
            className="profileBox"
            onClick={() => navigate("/books")}
          >
            <h3>📖 Books</h3>
            <p>Browse and reserve books</p>
          </div>

          <div
            className="profileBox"
            onClick={() => navigate("/my-reservations")}
          >
            <h3>📅 My Reservations</h3>
            <p>View your active reservations</p>
          </div>
        </div>
      </section>
    </div>
  );
}