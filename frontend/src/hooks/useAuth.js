/*
  useAuth.js
  ----------
  Hook מותאם אישית לצריכת AuthContext.

  אחריות:
  - לספק גישה נוחה למידע ולפעולות של המשתמש המחובר
  - למנוע שימוש ישיר חוזר ב-useContext בכל קומפוננטה
*/

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
