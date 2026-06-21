/*
=========================================================
LibrarianProfileDashboard.jsx

תיאור הקובץ:
דשבורד ספרן בדף הפרופיל.

הקובץ כולל:
- הצגת נתונים חשובים ודחופים לספרן מתוך ה-DB.
- הצגת פעילות יומית אחרונה.
- הצגת כרטיסי Quick Management לניווט לדפי ניהול.
- הפרדה בין מידע להצגה בלבד לבין פעולות לחיצות.
=========================================================
*/

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/*
---------------------------------------------------------
LibrarianProfileDashboard

תפקיד:
מציג לספרן מרכז בקרה מקצועי:
נתונים חשובים, פעילות אחרונה וקישורי ניהול מהירים.
---------------------------------------------------------
*/
export default function LibrarianProfileDashboard() {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState({
    activeLoans: 0,
    overdueBooks: 0,
    unreadMessages: 0,
    blockedSeats: 0,
    todayActivity: [],
  });

  /*
  ---------------------------------------------------------
  טעינת נתוני דשבורד הספרן

  תפקיד:
  שולפת מהשרת נתונים אמיתיים מה-DB.
  אם השרת לא זמין, מוצגים נתוני גיבוי זמניים.
  ---------------------------------------------------------
  */
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/librarian/dashboard-stats",
          {
            credentials: "include",
          },
        );

        const data = await response.json();

        if (data.success) {
          setDashboardData({
            activeLoans: data.stats.activeLoans || 0,
            overdueBooks: data.stats.overdueBooks || 0,
            unreadMessages: data.stats.unreadMessages || 0,
            blockedSeats: data.stats.blockedSeats || 0,
            todayActivity: data.stats.todayActivity || [],
          });
        }
      } catch (error) {
        console.error("Dashboard Error:", error);

        setDashboardData({
          activeLoans: 0,
          overdueBooks: 0,
          unreadMessages: 0,
          blockedSeats: 0,
          todayActivity: [],
        });
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="profileSection">
      <h2>Librarian Dashboard</h2>

      <section className="dashboardBlock">
        <h3 className="dashboardBlockTitle">Important Updates</h3>

        <div className="dashboardStatsGrid">
          <div className="dashboardStatCard">
            <span className="dashboardStatIcon">📚</span>

            <div>
              <h4>{dashboardData.activeLoans}</h4>
              <p>Active Loans</p>
            </div>
          </div>

          <div className="dashboardStatCard">
            <span className="dashboardStatIcon">⏰</span>

            <div>
              <h4>{dashboardData.overdueBooks}</h4>
              <p>Overdue Books</p>
            </div>
          </div>

          <div className="dashboardStatCard">
            <span className="dashboardStatIcon">✉️</span>

            <div>
              <h4>{dashboardData.unreadMessages}</h4>
              <p>Unread Messages</p>
            </div>
          </div>

          <div className="dashboardStatCard">
            <span className="dashboardStatIcon">🪑</span>

            <div>
              <h4>{dashboardData.blockedSeats}</h4>
              <p>Blocked Seats</p>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboardBlock">
        <h3 className="dashboardBlockTitle">Today&apos;s Activity</h3>

        <div className="dashboardActivityList">
          {dashboardData.todayActivity.length > 0 ? (
            dashboardData.todayActivity.map((activity, index) => (
              <div key={index} className="dashboardActivityItem">
                <span>•</span>
                <p>{activity}</p>
              </div>
            ))
          ) : (
            <p className="dashboardEmptyText">No activity today.</p>
          )}
        </div>
      </section>

      <section className="dashboardBlock">
        <h3 className="dashboardBlockTitle">Quick Management</h3>

        <div className="profileGrid librarianProfileGrid">
          <div className="profileBox" onClick={() => navigate("/books")}>
            <h3>📖 Manage Books</h3>
            <p>View, add, edit and remove books</p>
          </div>

          <div className="profileBox" onClick={() => navigate("/admin/map")}>
            <h3>🪑 Manage Seats</h3>
            <p>Control library map and seating areas</p>
          </div>

          <div className="profileBox" onClick={() => navigate("/admin/users")}>
            <h3>👥 Users Management</h3>
            <p>Manage readers and librarians</p>
          </div>

          <div className="profileBox" onClick={() => navigate("/reports")}>
            <h3>📊 Reports</h3>
            <p>View library statistics and reports</p>
          </div>

          <div className="profileBox" onClick={() => navigate("/messages")}>
            <h3>✉️ Messages</h3>
            <p>View messages from users</p>
          </div>
        </div>
      </section>
    </div>
  );
}
