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
import MyMessagesPage from "../pages/MyMessagesPage";
import LibrarianDashboardPage from "../pages/LibrarianDashboardPage";
import ProtectedRoute from "../components/common/ProtectedRoute";
import GuestRoute from "../components/common/GuestRoute";
import RoleRoute from "../components/common/RoleRoute";
import PageShell from "../components/layout/PageShell";

/*
---------------------------------------------------------
LIBRARIAN_ROLES

תפקיד:
מרכז את רשימת התפקידים המורשים
לגשת לדפי ניהול הספרייה.
---------------------------------------------------------
*/
const LIBRARIAN_ROLES = ["librarian"];


/*
---------------------------------------------------------
READER_ROLES

תפקיד:
מרכז את רשימת התפקידים המורשים לגשת
לדפים האישיים של משתמשי הספרייה.
---------------------------------------------------------
*/
const READER_ROLES = ["reader"];

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

        <Route
          path="/my-messages"
          element={
            <RoleRoute allowedRoles={READER_ROLES}>
              <MyMessagesPage />
            </RoleRoute>
          }
        />

        {/* ===== דפים לספרן בלבד ===== */}

        <Route
          path="/admin/librarian"
          element={
            <RoleRoute allowedRoles={LIBRARIAN_ROLES}>
              <LibrarianDashboardPage />
            </RoleRoute>
          }
        />

        <Route
          path="/admin/books"
          element={
            <RoleRoute allowedRoles={LIBRARIAN_ROLES}>
              <BooksPage />
            </RoleRoute>
          }
        />

        <Route
          path="/admin/add-book"
          element={
            <RoleRoute allowedRoles={LIBRARIAN_ROLES}>
              <AddBookPage />
            </RoleRoute>
          }
        />

        <Route
          path="/admin/map"
          element={
            <RoleRoute allowedRoles={LIBRARIAN_ROLES}>
              <AdminMapPage />
            </RoleRoute>
          }
        />

        <Route
          path="/messages"
          element={
            <RoleRoute allowedRoles={LIBRARIAN_ROLES}>
              <MessagesPage />
            </RoleRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <RoleRoute allowedRoles={LIBRARIAN_ROLES}>
              <UsersManagementPage />
            </RoleRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <RoleRoute allowedRoles={LIBRARIAN_ROLES}>
              <ReportsPage />
            </RoleRoute>
          }
        />

        <Route
          path="/admin/reservations"
          element={
            <RoleRoute allowedRoles={LIBRARIAN_ROLES}>
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
