/*
  main.jsx
  --------
  קובץ הכניסה הראשי של האפליקציה.

  אחריות:
  - הרצת האפליקציה
  - עטיפת כל המערכת ב-AuthProvider
  - טעינת כל קבצי העיצוב בצורה מסודרת
*/

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App/app";

// Context
import { AuthProvider } from "./context/AuthContext";

// ===== Styles (סדר חשוב) =====
import "./styles/variables.css";
import "./styles/globals.css";
import "./styles/layout.css";
import "./styles/forms.css";
import "./styles/home.css";
import "./styles/books.css";

/* פיצול חדש של המפה */
import "./styles/room-map.css";
import "./styles/map-page.css";
import "./styles/map-responsive.css";

import "./styles/reserve-book.css";
import "./styles/about.css";
import "./styles/events.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
