/*
=========================================================
routes.jsx

תיאור הקובץ:
קובץ ניהול הניווט של המערכת.

אחריות:
- הגדרת כל הנתיבים במקום אחד.
- הגנה על דפים לפי מצב התחברות והרשאות.
- הוספת נתיבי רשימות ההמתנה.
- הפניית נתיבים לא קיימים לדף הבית.
=========================================================
*/

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AboutPage from "../pages/AboutPage";
import AddBookPage from "../pages/AddBookPage";
import AdminMapPage from "../pages/AdminMapPage";
import BooksPage from "../pages/BooksPage";
import EventsPage from "../pages/EventsPage";
import HomePage from "../pages/HomePage";

import LibrarianDashboardPage from "../pages/LibrarianDashboardPage";

import LoginPage from "../pages/LoginPage";

import ManageReservationsPage from "../pages/ManageReservationsPage";

import ManageWaitingListsPage from "../pages/ManageWaitingListsPage";

import MapPage from "../pages/MapPage";
import MessagesPage from "../pages/MessagesPage";
import MyMessagesPage from "../pages/MyMessagesPage";

import MyReservationsPage from "../pages/MyReservationsPage";

import MyWaitingListsPage from "../pages/MyWaitingListsPage";

import NotificationsPage from "../pages/NotificationsPage";
import ProfilePage from "../pages/ProfilePage";
import RegisterPage from "../pages/RegisterPage";
import ReportsPage from "../pages/ReportsPage";
import ReserveBookPage from "../pages/ReserveBookPage";

import UsersManagementPage from "../pages/UsersManagementPage";

import GuestRoute from "../components/common/GuestRoute";

import ProtectedRoute from "../components/common/ProtectedRoute";

import RoleRoute from "../components/common/RoleRoute";

import PageShell from "../components/layout/PageShell";

/*
---------------------------------------------------------
LIBRARIAN_ROLES

תפקיד:
מרכז את רשימת התפקידים המורשים לגשת
לדפי ניהול הספרייה.
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
מגדיר את כל נתיבי המערכת ואת הרשאות הגישה
לכל עמוד.
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

        {/* ===== דפים לכל משתמש מחובר ===== */}

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

        {/*
        דף ההתראות משותף לקורא ולספרנית.

        השרת מחזיר רק את ההתראות השייכות
        למשתמש המחובר לפי ה-Session.
        */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
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

        {/*
        דף רשימות ההמתנה האישיות.

        השרת מזהה את המשתמש באמצעות ה-Session
        ומחזיר רק את ההמתנות השייכות לו.
        */}
        <Route
          path="/my-waiting-lists"
          element={
            <ProtectedRoute>
              <MyWaitingListsPage />
            </ProtectedRoute>
          }
        />

        {/* ===== דפים לקוראים בלבד ===== */}

        <Route
          path="/my-messages"
          element={
            <RoleRoute allowedRoles={READER_ROLES}>
              <MyMessagesPage />
            </RoleRoute>
          }
        />

        {/* ===== דפים לספרנית בלבד ===== */}

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

        {/*
        דף ניהול רשימות ההמתנה.

        רק ספרנית רשאית לראות את כל המשתמשים
        הממתינים ואת מצב ההצעות במערכת.
        */}
        <Route
          path="/admin/waiting-lists"
          element={
            <RoleRoute allowedRoles={LIBRARIAN_ROLES}>
              <ManageWaitingListsPage />
            </RoleRoute>
          }
        />

        {/* ===== נתיב ברירת מחדל ===== */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
