/*
  routes.jsx
  ----------
  קובץ ניהול הניווט של המערכת.

  אחריות:
  - הגדרת כל הנתיבים במקום אחד
  - הגנה על דפים לפי מצב התחברות והרשאות
*/

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import HomePage from "../pages/HomePage";
import MapPage from "../pages/MapPage";
import BooksPage from "../pages/BooksPage";
import EventsPage from "../pages/EventsPage";
import AboutPage from "../pages/AboutPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ReserveBookPage from "../pages/ReserveBookPage";

import ProtectedRoute from "../components/common/ProtectedRoute";
import GuestRoute from "../components/common/GuestRoute";
import RoleRoute from "../components/common/RoleRoute";

// דוגמת דף ספרן זמני לצורך בדיקת הרשאות
function LibrarianDashboardPage() {
  return (
    <div style={{ padding: "40px", color: "white", textAlign: "center" }}>
      <h1>Librarian Dashboard</h1>
      <p>גישה מותרת רק למשתמש עם role = librarian</p>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* דפים ציבוריים */}
        <Route path="/" element={<HomePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* דפי אורח בלבד */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />

        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />

        {/* דף שדורש התחברות */}
        <Route
          path="/reserve-book/:id"
          element={
            <ProtectedRoute>
              <ReserveBookPage />
            </ProtectedRoute>
          }
        />

        {/* דוגמה לדף מנהל / ספרן בלבד */}
        <Route
          path="/librarian"
          element={
            <RoleRoute allowedRoles={["librarian"]}>
              <LibrarianDashboardPage />
            </RoleRoute>
          }
        />

        {/* כל נתיב לא קיים יחזור לדף הבית */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
