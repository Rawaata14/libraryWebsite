/*
  GuestRoute.jsx
  --------------
  קומפוננטה להגבלת גישה לדפים של אורח בלבד.

  אחריות:
  - למנוע ממשתמש מחובר להיכנס שוב לדפי login / register
  - אם המשתמש כבר מחובר, להפנות לדף הבית
*/

import { Navigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

export default function GuestRoute({ children }) {
  const { isAuthenticated, isAuthReady } = useAuth();

  if (!isAuthReady) {
    return <div className="routeLoading">Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}
