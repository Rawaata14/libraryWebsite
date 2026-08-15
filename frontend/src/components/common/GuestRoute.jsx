/*
  GuestRoute.jsx
  --------------
  קומפוננטה להגבלת גישה לדפים של אורח בלבד.

  אחריות:
  - למנוע ממשתמש מחובר להיכנס שוב לדפי login / register
  - אם המשתמש כבר מחובר, להפנות לדף הבית
*/

import PropTypes from "prop-types";

import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function GuestRoute({ children }) {
  const { isAuthenticated, isAuthReady } = useContext(AuthContext);

  if (!isAuthReady) {
    return <div className="routeLoading">Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

GuestRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
