import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function UserProfileDashboard() {
  const navigate = useNavigate();

  // 1. הפרדת הסטייט למשתנים פשוטים (בדיוק כמו שאת רגילה)
  const [stats, setStats] = useState({
    borrowedBooks: 0,
    activeReservations: 0,
    unreadNotifications: 0,
  });
  const [upcomingReservations, setUpcomingReservations] = useState([]);

  // 2. פונקציה ראשונה: הבאת הסטטיסטיקות של המשתמש
  const fetchUserStats = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/user/dashboard-stats",
        { withCredentials: true },
      );
      if (response.data.success) {
        setStats({
          borrowedBooks: response.data.stats.borrowedBooks || 0,
          activeReservations: response.data.stats.activeReservations || 0,
          unreadNotifications: response.data.stats.unreadNotifications || 0,
        });
      }
    } catch (error) {
      console.error("User dashboard stats error:", error);
    }
  };

  // 3. פונקציה שנייה: הבאת ההזמנות מהראוטר החדש
  const getUserReservations = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/reservations/get-reservations",
        { withCredentials: true },
      );
      if (response.status === 200) {
        setUpcomingReservations(response.data.reservations || []);
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
    }
  };

  // 4. ה-useEffect הופך להיות קצר, נקי ומובן - רק מפעיל את הפונקציות בטעינה!
  useEffect(() => {
    fetchUserStats();
    getUserReservations();
  }, []);

  return (
    <div className="profileSection">
      <h2>User Dashboard</h2>

      {/* ===== בלוק הסטטיסטיקות ===== */}
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
              <p>New Notifications</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== בלוק ההזמנות הקרובות ===== */}
      <section className="dashboardBlock">
        <h3 className="dashboardBlockTitle">Upcoming Reservations</h3>
        <div className="userReservationsList">
          {upcomingReservations.length > 0 ? (
            upcomingReservations.map((reservation) => (
              <div
                key={reservation.reservationId}
                className="userReservationItem"
              >
                <div>
                  <strong>Seat {reservation.seatId}</strong>
                  <p>
                    {reservation.reservationDate} | {reservation.startTime} -{" "}
                    {reservation.endTime}
                  </p>
                </div>
                <span className="reservationStatus">{reservation.status}</span>
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
          <div className="profileBox" onClick={() => navigate("/map")}>
            <h3>🪑 Study Rooms</h3>
            <p>Reserve a study seat or room</p>
          </div>

          <div className="profileBox" onClick={() => navigate("/books")}>
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
