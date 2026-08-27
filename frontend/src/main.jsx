/*
=========================================================
main.jsx

תיאור הקובץ:
קובץ הכניסה הראשי של האפליקציה.

אחריות:
- הרצת האפליקציה.
- עטיפת המערכת ב-AuthProvider.
- עטיפת המערכת ב-NotificationProvider.
- טעינת קובצי העיצוב הכלליים.
=========================================================
*/

import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App/app";

/*
---------------------------------------------------------
Context Providers
---------------------------------------------------------
*/
import { AuthProvider } from "./context/AuthContext";

import { NotificationProvider } from "./context/NotificationContext";

/*
---------------------------------------------------------
קובצי עיצוב כלליים

סדר הטעינה חשוב.
---------------------------------------------------------
*/
import "./styles/variables.css";
import "./styles/globals.css";
import "./styles/layout.css";
import "./styles/forms.css";
import "./styles/home.css";
import "./styles/books.css";

/*
פיצול העיצוב של המפה.
*/
import "./styles/room-map.css";
import "./styles/map-page.css";
import "./styles/map-responsive.css";

import "./styles/reserve-book.css";
import "./styles/about.css";
import "./styles/events.css";
import "./styles/notifications.css";

/*
---------------------------------------------------------
הרצת האפליקציה

NotificationProvider נמצא בתוך AuthProvider,
משום שהוא זקוק למידע על המשתמש המחובר.

כך ההתראות נטענות רק לאחר שבדיקת ה-Session
הסתיימה בהצלחה.
---------------------------------------------------------
*/
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </AuthProvider>
  </React.StrictMode>,
);
