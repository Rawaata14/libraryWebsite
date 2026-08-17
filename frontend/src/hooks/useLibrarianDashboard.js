/*
=========================================================
useLibrarianDashboard.js

תיאור הקובץ:
Custom Hook לטעינת נתוני דשבורד הספרנית.

ה-Hook אחראי על:
- טעינת סטטיסטיקות הספרייה מהשרת.
- שמירת מצב טעינה.
- שמירת הודעת שגיאה.
- רענון הנתונים לפי דרישה.
=========================================================
*/

import { useCallback, useEffect, useState } from "react";

import { getLibrarianDashboardStats } from "../services/dashboardService";

const initialStats = {
  activeLoans: 0,
  overdueBooks: 0,
  unreadMessages: 0,
  blockedSeats: 0,
  todayReservations: 0,
  todayActivity: [],
};

/*
---------------------------------------------------------
useLibrarianDashboard

תפקיד:
טוען ומחזיר את נתוני דשבורד הספרנית.
---------------------------------------------------------
*/
export default function useLibrarianDashboard() {
  const [stats, setStats] = useState(initialStats);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  /*
  ---------------------------------------------------------
  fetchDashboardStats

  תפקיד:
  מבקש מהשרת את נתוני הדשבורד ומעדכן
  את ה-State המקומי.
  ---------------------------------------------------------
  */
  const fetchDashboardStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await getLibrarianDashboardStats();

      const receivedStats = response.data?.stats || {};

      setStats({
        activeLoans: Number(receivedStats.activeLoans) || 0,
        overdueBooks: Number(receivedStats.overdueBooks) || 0,
        unreadMessages: Number(receivedStats.unreadMessages) || 0,
        blockedSeats: Number(receivedStats.blockedSeats) || 0,
        todayReservations: Number(receivedStats.todayReservations) || 0,
        todayActivity: Array.isArray(receivedStats.todayActivity)
          ? receivedStats.todayActivity
          : [],
      });
    } catch (error) {
      console.error("Error loading librarian dashboard:", error);

      setErrorMessage(
        error.response?.data?.message ||
          "Failed to load librarian dashboard data.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  /*
  ---------------------------------------------------------
  טעינת נתוני הספרנית

  תפקיד:
  מפעילה את טעינת הנתונים כאשר ה-Hook עולה.
  ---------------------------------------------------------
  */
  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  return {
    stats,
    isLoading,
    errorMessage,
    fetchDashboardStats,
  };
}
