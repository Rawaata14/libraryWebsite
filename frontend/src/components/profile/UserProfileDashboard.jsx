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
        setStats((prevStats) => ({
          ...prevStats, // שומר על מה שפונקציות אחרות כבר עדכנו (כמו activeReservations)
          borrowedBooks: response.data.stats.borrowedBooks || 0,
          unreadNotifications: response.data.stats.unreadNotifications || 0,
          // ✂️ מחקנו מכאן את העדכון הישיר של activeReservations כדי שלא ידרוס!
        }));
      }
    } catch (error) {
      console.error("User dashboard stats error:", error);
    }
  };

  // 2. הפונקציה של ההזמנות
  const getUserReservations = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/reservations/get-reservations",
        { withCredentials: true },
      );

      if (response.status === 200) {
        const reservationsList = response.data.reservations || [];
        setUpcomingReservations(reservationsList);

        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const todayStr = new Date(now.getTime() - offset)
          .toISOString()
          .split("T")[0];
        const currentTimeStr = now.toTimeString().split(" ")[0].substring(0, 5);

        const activeCount = reservationsList.filter((reservation) => {
          if (!reservation.reservationDate) return false;

          const dbDateObj = new Date(reservation.reservationDate);
          const dbOffset = dbDateObj.getTimezoneOffset() * 60000;
          const dbLocalDateStr = new Date(dbDateObj.getTime() - dbOffset)
            .toISOString()
            .split("T")[0];

          const isToday = dbLocalDateStr === todayStr;
          const isStarted = currentTimeStr >= reservation.startTime;
          const isNotEnded = currentTimeStr < reservation.endTime;

          return isToday && isStarted && isNotEnded;
        }).length;

        // מעדכן בבטחה את ה-Counter האמיתי שחישבנו כאן
        setStats((prevStats) => ({
          ...prevStats,
          activeReservations: activeCount, // קובע את המספר האמיתי מהסינון
        }));
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
                    {reservation.reservationDate} | {reservation.startTime} -
                    {""}
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
