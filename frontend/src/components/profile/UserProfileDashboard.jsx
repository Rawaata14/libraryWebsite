/*
=========================================================
UserProfileDashboard.jsx

תיאור הקובץ:
דשבורד משתמש רגיל בדף הפרופיל.

הקובץ כולל:
- שליפת נתוני משתמש מה-DB.
- הצגת סיכום פעילות המשתמש.
- הצגת הזמנות קרובות.
- הצגת פעולות מהירות למשתמש.
=========================================================
*/

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

/*
---------------------------------------------------------
UserProfileDashboard

תפקיד:
מציג למשתמש מידע חשוב על הפעילות שלו במערכת:
ספרים מושאלים, הזמנות פעילות, התראות והזמנות קרובות.
---------------------------------------------------------
*/
export default function UserProfileDashboard() {
  const navigate = useNavigate();

  const getUserReservations = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/reservations/get-reservations",
        { withCredentials: true },
      );
      if (response.status === 200) {
        console.log("User Reservations:", response.data.reservations);
      } else {
        console.error("Failed to fetch reservations");
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
    }
  };
  
  const [dashboardData, setDashboardData] = useState({
    borrowedBooks: 0,
    activeReservations: 0,
    unreadNotifications: 0,
    upcomingReservations: [],
  });

  /*
  ---------------------------------------------------------
  טעינת נתוני דשבורד המשתמש

  תפקיד:
  שולפת מהשרת נתונים אמיתיים מה-DB עבור המשתמש המחובר.
  ---------------------------------------------------------
  */
  useEffect(() => {
    const fetchUserDashboard = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/user/dashboard-stats",
          {
            credentials: "include",
          },
        );

        const data = await response.json();

        if (data.success) {
          setDashboardData({
            borrowedBooks: data.stats.borrowedBooks || 0,
            activeReservations: data.stats.activeReservations || 0,
            unreadNotifications: data.stats.unreadNotifications || 0,
            upcomingReservations: data.stats.upcomingReservations || [],
          });
        }
      } catch (error) {
        console.error("User dashboard error:", error);
      }
    };

    fetchUserDashboard();
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
              <h4>{dashboardData.borrowedBooks}</h4>
              <p>Borrowed Books</p>
            </div>
          </div>

          <div className="dashboardStatCard">
            <span className="dashboardStatIcon">📅</span>

            <div>
              <h4>{dashboardData.activeReservations}</h4>
              <p>Active Reservations</p>
            </div>
          </div>

          <div className="dashboardStatCard">
            <span className="dashboardStatIcon">🔔</span>

            <div>
              <h4>{dashboardData.unreadNotifications}</h4>
              <p>New Notifications</p>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboardBlock">
        <h3 className="dashboardBlockTitle">Upcoming Reservations</h3>

        <div className="userReservationsList">
          {dashboardData.upcomingReservations.length > 0 ? (
            dashboardData.upcomingReservations.map((reservation) => (
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
