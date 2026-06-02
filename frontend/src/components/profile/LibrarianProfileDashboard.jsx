/*
=========================================================
LibrarianProfileDashboard.jsx

תיאור הקובץ:
דשבורד ספרן בדף הפרופיל.

תפקיד:
- מציג כרטיסי ניהול לספרן.
- שולף עדכונים מהשרת.
- מציג נתוני גיבוי אם השרת לא זמין.
=========================================================
*/

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LibrarianProfileDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    books: [],
    seats: [],
    users: [],
    reports: [],
    messages: [],
  });

  /*
  ---------------------------------------------------------
  טעינת נתוני Dashboard של הספרן

  תפקיד:
  שולפת עדכונים מהשרת ומציגה נתוני גיבוי במקרה של שגיאה.
  ---------------------------------------------------------
  */
  useEffect(() => {
    const fetchLibrarianStats = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/librarian/dashboard-stats",
          {
            credentials: "include",
          },
        );

        const data = await response.json();

        if (data.success) {
          setStats({
            books: data.stats.books || [],
            seats: data.stats.seats || [],
            users: data.stats.users || [],
            reports: data.stats.reports || [],
            messages: data.stats.messages || [],
          });
        }
      } catch (error) {
        console.error("Dashboard Error:", error);

        setStats({
          books: [
            { text: "3 בקשות השאלת ספרים ממתינות", link: "/manage-books" },
          ],
          seats: [{ text: "80% תפוסה בחדרי הלימוד", link: "/manage-seats" }],
          users: [{ text: "2 משתמשים חדשים נרשמו", link: "/manage-users" }],
          reports: [{ text: "הספר המבוקש ביותר: ההוביט", link: "/reports" }],
          messages: [{ text: "2 הודעות חדשות ממשתמשים", link: "/messages" }],
        });
      }
    };

    fetchLibrarianStats();
  }, []);

  /*
  ---------------------------------------------------------
  הצגת התראות בכרטיס ניהול

  תפקיד:
  מקבלת מערך התראות ומציגה אותן מתחת לכרטיס המתאים.
  ---------------------------------------------------------
  */
  const renderUpdates = (items) => (
    <div className="updatesContainer">
      {items.map((item, index) => (
        <div
          key={index}
          className="updateNotification"
          onClick={(event) => {
            event.stopPropagation();
            navigate(item.link);
          }}
        >
          {item.text}
        </div>
      ))}
    </div>
  );

  return (
    <div className="profileSection">
      <h2>Librarian Dashboard</h2>

      <div className="profileGrid librarianProfileGrid">
        <div className="profileBox" onClick={() => navigate("/manage-books")}>
          <h3>📖 Manage Books</h3>
          <p>Add / Edit / Remove Books</p>
          {renderUpdates(stats.books)}
        </div>

        <div className="profileBox" onClick={() => navigate("/manage-seats")}>
          <h3>🪑 Manage Seats</h3>
          <p>Control Library Map</p>
          {renderUpdates(stats.seats)}
        </div>

        <div className="profileBox" onClick={() => navigate("/manage-users")}>
          <h3>👥 Users Management</h3>
          <p>Manage Library Users</p>
          {renderUpdates(stats.users)}
        </div>

        <div className="profileBox" onClick={() => navigate("/reports")}>
          <h3>📊 Reports</h3>
          <p>Library Statistics & Reports</p>
          {renderUpdates(stats.reports)}
        </div>

        <div className="profileBox" onClick={() => navigate("/messages")}>
          <h3>✉️ Messages</h3>
          <p>Messages From Users</p>
          {renderUpdates(stats.messages)}
        </div>
      </div>
    </div>
  );
}
