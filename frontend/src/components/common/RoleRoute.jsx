/*
  RoleRoute.jsx
  -------------
  קומפוננטה להגנה על נתיבים לפי תפקיד משתמש.

  אחריות:
  - לבדוק שהמשתמש מחובר
  - לבדוק שלמשתמש יש הרשאה מתאימה
  - לאפשר גישה רק לתפקידים מורשים
*/

import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";


export default function RoleRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, isAuthReady } = useContext(AuthContext);

  if (!isAuthReady) {
    return <div className="routeLoading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
