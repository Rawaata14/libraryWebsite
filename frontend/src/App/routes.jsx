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
import AddBookPage from "../pages/AddBookPage";
import ProfilePage from "../pages/ProfilePage";
import AdminMapPage from "../pages/AdminMapPage";
import LibraryMap from "../components/map/LibraryMap";
import ProtectedRoute from "../components/common/ProtectedRoute";
import GuestRoute from "../components/common/GuestRoute";
import RoleRoute from "../components/common/RoleRoute";
import PageShell from "../components/layout/PageShell";
import { useRef   } from "react";

/* דף זמני לספרן */
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

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ===== Public Pages ===== */}

        <Route path="/" element={<HomePage />} />

        <Route path="/map" element={<MapPage />} />

        <Route path="/books" element={<BooksPage />} />

        <Route path="/events" element={<EventsPage />} />

        <Route path="/about" element={<AboutPage />} />

        {/* ===== Guest Only ===== */}

        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage  />
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

        {/* ===== Protected ===== */}

        <Route
          path="/reserve-book/:id"
          element={
            <ProtectedRoute>
              <ReserveBookPage />
            </ProtectedRoute>
          }
        />

        {/* ===== Profile ===== */}

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <PageShell>
                <ProfilePage  />
              </PageShell>
            </ProtectedRoute>
          }
        />

        {/* ===== Librarian Only ===== */}

        <Route
          path="/librarian"
          element={
            <RoleRoute allowedRoles={["librarian"]}>
              <LibrarianDashboardPage />
            </RoleRoute>
          }
        />

        <Route
          path="admin/books"
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

        {/* ===== Fallback ===== */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
