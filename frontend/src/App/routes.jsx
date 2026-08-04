/*
  routes.jsx
  ----------

  קובץ ניהול הניווט של המערכת.

  אחריות:
  - הגדרת כל הנתיבים במקום אחד.
  - הגנה על דפים לפי מצב התחברות והרשאות.
  - הפניית נתיבים לא קיימים לדף הבית.
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
import AddBookPage from "../pages/AddBookPage";
import ProfilePage from "../pages/ProfilePage";
import AdminMapPage from "../pages/AdminMapPage";
import MessagesPage from "../pages/MessagesPage";
import UsersManagementPage from "../pages/UsersManagementPage";
import ReportsPage from "../pages/ReportsPage";
import MyReservationsPage from "../pages/MyReservationsPage";
import ManageReservationsPage from "../pages/ManageReservationsPage";

import ProtectedRoute from "../components/common/ProtectedRoute";
import GuestRoute from "../components/common/GuestRoute";
import RoleRoute from "../components/common/RoleRoute";
import PageShell from "../components/layout/PageShell";

/*
---------------------------------------------------------
LibrarianDashboardPage

תפקיד:
דף זמני שמוגן ומאפשר כניסה לספרנים בלבד.
---------------------------------------------------------
*/
function LibrarianDashboardPage() {
  return (
    <div
      style={{
        padding: "40px",
        color: "white",
        textAlign: "center",
      }}
    >
      <h1>Librarian Dashboard</h1>

      <p>גישה מותרת רק למשתמש עם role = librarian</p>
    </div>
  );
}

/*
---------------------------------------------------------
AppRoutes

תפקיד:
מגדיר את כל נתיבי המערכת ואת הרשאות הגישה לכל עמוד.
---------------------------------------------------------
*/
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ===== דפים ציבוריים ===== */}

        <Route path="/" element={<HomePage />} />

        <Route path="/map" element={<MapPage />} />

        <Route path="/books" element={<BooksPage />} />

        <Route path="/events" element={<EventsPage />} />

        <Route path="/about" element={<AboutPage />} />

        {/* ===== דפים לאורחים בלבד ===== */}

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

        {/* ===== דפים למשתמשים מחוברים ===== */}

        <Route
          path="/reserve-book/:id"
          element={
            <ProtectedRoute>
              <ReserveBookPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <PageShell>
                <ProfilePage />
              </PageShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-reservations"
          element={
            <ProtectedRoute>
              <MyReservationsPage />
            </ProtectedRoute>
          }
        />

        {/* ===== דפים לספרן בלבד ===== */}

        <Route
          path="/librarian"
          element={
            <RoleRoute allowedRoles={["librarian"]}>
              <LibrarianDashboardPage />
            </RoleRoute>
          }
        />

        <Route
          path="/admin/books"
          element={
            <RoleRoute allowedRoles={["librarian"]}>
              <BooksPage />
            </RoleRoute>
          }
        />

        <Route
          path="/admin/add-book"
          element={
            <RoleRoute allowedRoles={["librarian"]}>
              <AddBookPage />
            </RoleRoute>
          }
        />

        <Route
          path="/admin/map"
          element={
            <RoleRoute allowedRoles={["librarian"]}>
              <AdminMapPage />
            </RoleRoute>
          }
        />

        <Route
          path="/messages"
          element={
            <RoleRoute allowedRoles={["librarian"]}>
              <MessagesPage />
            </RoleRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <RoleRoute allowedRoles={["librarian"]}>
              <UsersManagementPage />
            </RoleRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <RoleRoute allowedRoles={["librarian"]}>
              <ReportsPage />
            </RoleRoute>
          }
        />

        <Route
          path="/admin/reservations"
          element={
            <RoleRoute allowedRoles={["librarian"]}>
              <ManageReservationsPage />
            </RoleRoute>
          }
        />

        {/* ===== נתיב ברירת מחדל ===== */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
