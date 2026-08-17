/*
=========================================================
dashboardService.js

תיאור הקובץ:
מרכז את בקשות ה-API הקשורות לדשבורדים
של המשתמש ושל הספרן.
=========================================================
*/

import axios from "axios";

import { buildApiUrl } from "../config/api";

/*
---------------------------------------------------------
getUserDashboardStats

תפקיד:
טוענת את נתוני הדשבורד של המשתמש המחובר,
כולל סטטיסטיקות והזמנות עתידיות.
---------------------------------------------------------
*/
export function getUserDashboardStats() {
  return axios.get(buildApiUrl("/user/dashboard-stats"), {
    withCredentials: true,
  });
}

/*
---------------------------------------------------------
getLibrarianDashboardStats

תפקיד:
טוענת את נתוני הדשבורד של הספרן המחובר.
---------------------------------------------------------
*/
export function getLibrarianDashboardStats() {
  return axios.get(buildApiUrl("/api/librarian/dashboard-stats"), {
    withCredentials: true,
  });
}
