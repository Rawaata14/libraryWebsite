/*
=========================================================
ReportsPage.jsx

תיאור הקובץ:
דף דוחות וסטטיסטיקות עבור הספרן.

הקובץ כולל:
- שליפת נתוני דוחות מהשרת.
- הצגת כרטיסי סטטיסטיקה.
- הצגת נתונים חשובים על פעילות המערכת.
=========================================================
*/

import { useEffect, useState } from "react";
import PageShell from "../components/layout/PageShell";
import PageBanner from "../components/layout/PageBanner";
import "../styles/reports.css";

/*
---------------------------------------------------------
ReportsPage

תפקיד:
מציג לספרן תמונת מצב כללית על פעילות הספרייה.
---------------------------------------------------------
*/
export default function ReportsPage() {
  const [reports, setReports] = useState({
    totalUsers: 0,
    totalBooks: 0,
    totalSeats: 0,
    activeReservations: 0,
    unreadMessages: 0,
    blockedUsers: 0,
  });

  /*
  ---------------------------------------------------------
  fetchReports

  תפקיד:
  שולף נתוני דוחות מהשרת.
  ---------------------------------------------------------
  */
  const fetchReports = async () => {
    try {
      const response = await fetch("http://localhost:8000/reports", {
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        setReports(data.reports);
      }
    } catch (error) {
      console.error("Fetch reports error:", error);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <PageShell>
      <PageBanner title="Reports" />

      <div className="reportsContainer">
        <div className="reportsCard">
          <h2>Library Statistics</h2>

          <div className="reportsGrid">
            <div className="reportBox">
              <span>👥</span>
              <h3>{reports.totalUsers}</h3>
              <p>Total Users</p>
            </div>

            <div className="reportBox">
              <span>📚</span>
              <h3>{reports.totalBooks}</h3>
              <p>Total Books</p>
            </div>

            <div className="reportBox">
              <span>🪑</span>
              <h3>{reports.totalSeats}</h3>
              <p>Total Seats</p>
            </div>

            <div className="reportBox">
              <span>📅</span>
              <h3>{reports.activeReservations}</h3>
              <p>Active Reservations</p>
            </div>

            <div className="reportBox">
              <span>✉️</span>
              <h3>{reports.unreadMessages}</h3>
              <p>Unread Messages</p>
            </div>

            <div className="reportBox">
              <span>🚫</span>
              <h3>{reports.blockedUsers}</h3>
              <p>Blocked Users</p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
