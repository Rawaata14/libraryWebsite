/*
=========================================================
UserProfileDashboard.jsx

תיאור הקובץ:
דשבורד משתמש רגיל בדף הפרופיל.

תפקיד:
מציג פעולות ונתונים בסיסיים של משתמש רגיל.
=========================================================
*/

import { useNavigate } from "react-router-dom";
import axios from "axios";

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
  
  return (
    <div className="profileSection">
      <h2>My Activity</h2>

      <div className="profileGrid">
        <div className="profileBox" onClick={() => navigate("/my-books")}>
          <h3>📚 Borrowed Books</h3>
          <p>3 Active Books</p>
        </div>

        <div
          className="profileBox"
          onClick={() => navigate("/my-reservations")}
        >
          <h3>📅 Reservations</h3>
          <p>2 Active Reservations</p>
        </div>

        <div className="profileBox" onClick={() => navigate("/notifications")}>
          <h3>🔔 Notifications</h3>
          <p>No New Notifications</p>
        </div>
      </div>
    </div>
  );
}
