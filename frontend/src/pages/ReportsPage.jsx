/*
=========================================================
ReportsPage.jsx

תיאור הקובץ:
דף דוחות וסטטיסטיקות עבור הספרן.

הקובץ כולל:
- שליפת נתוני הדוחות דרך reportService.
- הצגת מצב טעינה ושגיאה.
- הצגת כרטיסי הסטטיסטיקה של הספרייה.
=========================================================
*/

import { useEffect, useState } from "react";
import PageShell from "../components/layout/PageShell";
import PageBanner from "../components/layout/PageBanner";
import { getReports } from "../services/reportService";
import "../styles/reports.css";

/*
---------------------------------------------------------
INITIAL_REPORTS

תפקיד:
ערכי ברירת המחדל של הדוחות לפני שהמידע מתקבל
מהשרת.
---------------------------------------------------------
*/
const INITIAL_REPORTS = {
  totalUsers: 0,
  totalBooks: 0,
  totalSeats: 0,
  activeReservations: 0,
  unreadMessages: 0,
  blockedUsers: 0,
};

/*
---------------------------------------------------------
ReportsPage

תפקיד:
מציג לספרן תמונת מצב כללית על פעילות הספרייה.
---------------------------------------------------------
*/
export default function ReportsPage() {
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  /*
  ---------------------------------------------------------
  fetchReports

  תפקיד:
  שולפת את נתוני הדוחות דרך שכבת השירות ומעדכנת
  את ה-State של הדף.
  ---------------------------------------------------------
  */
  const fetchReports = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const reportsData = await getReports();

      setReports({
        ...INITIAL_REPORTS,
        ...reportsData,
      });
    } catch (error) {
      console.error("Fetch reports error:", error);

      setErrorMessage(
        error.message || "An error occurred while loading the reports.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  /*
  ---------------------------------------------------------
  טעינת הדוחות

  תפקיד:
  מפעילה את טעינת הדוחות כאשר הדף נפתח.
  ---------------------------------------------------------
  */
  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <PageShell>
      <PageBanner title="Reports" />

      <div className="reportsContainer">
        <div className="reportsCard">
          <h2>Library Statistics</h2>

          {isLoading ? (
            <p role="status" aria-live="polite">
              Loading reports...
            </p>
          ) : errorMessage ? (
            <div role="alert">
              <p>{errorMessage}</p>

              <button type="button" onClick={fetchReports}>
                Try Again
              </button>
            </div>
          ) : (
            <div className="reportsGrid">
              <div className="reportBox">
                <span aria-hidden="true">👥</span>
                <h3>{reports.totalUsers}</h3>
                <p>Total Users</p>
              </div>

              <div className="reportBox">
                <span aria-hidden="true">📚</span>
                <h3>{reports.totalBooks}</h3>
                <p>Total Books</p>
              </div>

              <div className="reportBox">
                <span aria-hidden="true">🪑</span>
                <h3>{reports.totalSeats}</h3>
                <p>Total Seats</p>
              </div>

              <div className="reportBox">
                <span aria-hidden="true">📅</span>
                <h3>{reports.activeReservations}</h3>
                <p>Active Reservations</p>
              </div>

              <div className="reportBox">
                <span aria-hidden="true">✉️</span>
                <h3>{reports.unreadMessages}</h3>
                <p>Unread Messages</p>
              </div>

              <div className="reportBox">
                <span aria-hidden="true">🚫</span>
                <h3>{reports.blockedUsers}</h3>
                <p>Blocked Users</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
