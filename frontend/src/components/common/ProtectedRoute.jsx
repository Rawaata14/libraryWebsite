/*
  ProtectedRoute.jsx
  ------------------
  קומפוננטה להגנה על נתיבים שדורשים משתמש מחובר.

  אחריות:
  - לבדוק האם המשתמש מחובר
  - אם לא, להעביר אותו לדף ההתחברות
  - אם כן, לאפשר גישה לתוכן
*/

import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isAuthReady } = useAuth();
  const location = useLocation();

  // ממתינים לסיום טעינת מצב המשתמש
  if (!isAuthReady) {
    return <div className="routeLoading">Loading...</div>;
  }

  // אם המשתמש לא מחובר, מפנים ל-login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
