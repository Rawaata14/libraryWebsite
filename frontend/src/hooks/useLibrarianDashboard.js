/*
=========================================================
useLibrarianDashboard.js

תיאור הקובץ:
Custom Hook משותף לטעינת נתוני דשבורד הספרנית.

ה-Hook משמש את:
- דף הדשבורד הראשי.
- דשבורד הספרנית בפרופיל.
- הסרגל האנכי של הספרנית.

כך כל התצוגות מקבלות נתונים מאותו Endpoint.
=========================================================
*/

import { useCallback, useEffect, useState } from "react";

import { getLibrarianDashboardStats } from "../services/dashboardService";

/*
---------------------------------------------------------
DEFAULT_HOURLY_RESERVATIONS

תפקיד:
מספק מבנה התחלתי קבוע לחלונות הזמן
לפני שהנתונים מתקבלים מהשרת.
---------------------------------------------------------
*/
const DEFAULT_HOURLY_RESERVATIONS = [
  {
    startTime: "08:00",
    endTime: "10:00",
    booked: 0,
    available: 0,
  },
  {
    startTime: "10:00",
    endTime: "12:00",
    booked: 0,
    available: 0,
  },
  {
    startTime: "12:00",
    endTime: "14:00",
    booked: 0,
    available: 0,
  },
  {
    startTime: "14:00",
    endTime: "16:00",
    booked: 0,
    available: 0,
  },
  {
    startTime: "16:00",
    endTime: "18:00",
    booked: 0,
    available: 0,
  },
  {
    startTime: "18:00",
    endTime: "20:00",
    booked: 0,
    available: 0,
  },
];

const initialStats = {
  activeLoans: 0,
  overdueBooks: 0,
  unreadMessages: 0,
  blockedSeats: 0,
  todayReservations: 0,
  hourlyReservations: DEFAULT_HOURLY_RESERVATIONS,
  todayActivity: [],
};

/*
---------------------------------------------------------
normalizeHourlyReservations

תפקיד:
מוודאת שכל ערכי חלונות הזמן שמתקבלים מהשרת
נשמרים במבנה ובסוגי נתונים אחידים.
---------------------------------------------------------
*/
const normalizeHourlyReservations = (hourlyReservations) => {
  if (!Array.isArray(hourlyReservations)) {
    return DEFAULT_HOURLY_RESERVATIONS;
  }

  return hourlyReservations.map((slot) => ({
    startTime: String(slot.startTime || "").slice(0, 5),
    endTime: String(slot.endTime || "").slice(0, 5),
    booked: Number(slot.booked) || 0,
    available: Number(slot.available) || 0,
  }));
};

/*
---------------------------------------------------------
useLibrarianDashboard

תפקיד:
טוען ומחזיר את נתוני דשבורד הספרנית
ממקור הנתונים המשותף.
---------------------------------------------------------
*/
export default function useLibrarianDashboard() {
  const [stats, setStats] = useState(initialStats);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  /*
  -------------------------------------------------------
  fetchDashboardStats

  תפקיד:
  מבקש מהשרת את נתוני הדשבורד ומעדכן
  את ה-State המקומי.
  -------------------------------------------------------
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

        hourlyReservations: normalizeHourlyReservations(
          receivedStats.hourlyReservations,
        ),

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
  -------------------------------------------------------
  טעינת נתוני הספרנית

  תפקיד:
  מפעילה את טעינת הנתונים כאשר ה-Hook עולה.
  -------------------------------------------------------
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
