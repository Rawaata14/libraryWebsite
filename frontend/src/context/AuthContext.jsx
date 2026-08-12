/*
=========================================================
AuthContext.jsx

תיאור הקובץ:
Context גלובלי לניהול מצב ההתחברות במערכת.

הקובץ אחראי על:
- בדיקת ה-Session בעת טעינת האתר.
- שמירת המשתמש המחובר בזיכרון של React.
- עדכון המשתמש לאחר התחברות, הרשמה או עריכת פרופיל.
- ביצוע התנתקות מול ה-Backend.
- אספקת מצב ההתחברות והרשאות המשתמש לכל המערכת.
=========================================================
*/

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import PropTypes from "prop-types";

import { buildApiUrl } from "../config/api";

export const AuthContext = createContext(null);

/*
---------------------------------------------------------
AuthProvider

תפקיד:
עוטפת את המערכת ומספקת לכל הקומפוננטות
את מצב המשתמש ואת פעולות ההתחברות וההתנתקות.
---------------------------------------------------------
*/
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  /*
  ---------------------------------------------------------
  בדיקת Session בעת טעינת האתר

  תפקיד:
  פונה ל-Backend כדי לבדוק אם קיים Session פעיל.

  ה-Session הוא מקור האמת היחיד:
  נתוני המשתמש אינם נשמרים ב-localStorage.
  ---------------------------------------------------------
  */
  useEffect(() => {
    let isComponentActive = true;

    async function checkAuthentication() {
      try {
        const response = await fetch(buildApiUrl("/user/check-auth"), {
          credentials: "include",
        });

        if (!isComponentActive) return;

        if (!response.ok) {
          setUser(null);
          return;
        }

        const authenticatedUser = await response.json();

        setUser(authenticatedUser);
      } catch (error) {
        console.error("Error checking authentication:", error);

        if (isComponentActive) {
          setUser(null);
        }
      } finally {
        if (isComponentActive) {
          setIsAuthReady(true);
        }
      }
    }

    checkAuthentication();

    return () => {
      isComponentActive = false;
    };
  }, []);

  /*
  ---------------------------------------------------------
  setAuthenticatedUser

  תפקיד:
  שומרת את המשתמש שהתקבל מהשרת לאחר התחברות
  או הרשמה מוצלחת.

  למה נוצרה:
  פעולות ההתחברות וההרשמה מבצעות אותה פעולה בדיוק,
  ולכן אין צורך ליצור שתי פונקציות זהות.
  ---------------------------------------------------------
  */
  const setAuthenticatedUser = useCallback((userData) => {
    setUser(userData);
  }, []);

  /*
  ---------------------------------------------------------
  updateUser

  תפקיד:
  מעדכנת את נתוני המשתמש לאחר שינוי פרופיל
  או העלאת תמונת פרופיל.
  ---------------------------------------------------------
  */
  const updateUser = useCallback((updatedData) => {
    setUser((currentUser) => ({
      ...currentUser,
      ...updatedData,
    }));
  }, []);

  /*
  ---------------------------------------------------------
  logout

  תפקיד:
  מבקשת מה-Backend למחוק את ה-Session,
  ולאחר מכן מנקה את המשתמש ממצב ה-React.
  ---------------------------------------------------------
  */
  const logout = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl("/user/logout"), {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok && response.status !== 401) {
        const result = await response.json().catch(() => null);

        throw new Error(result?.message || "Logout failed");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setUser(null);
    }
  }, []);

  const isAuthenticated = Boolean(user);
  const isLibrarian = user?.role === "librarian";
  const isGuest = !isAuthenticated;

  /*
  ---------------------------------------------------------
  contextValue

  תפקיד:
  מרכזת את כל הנתונים והפעולות שהקומפוננטות
  במערכת יכולות לקבל מתוך AuthContext.
  ---------------------------------------------------------
  */
  const contextValue = useMemo(
    () => ({
      user,
      setUser,
      login: setAuthenticatedUser,
      register: setAuthenticatedUser,
      updateUser,
      logout,
      isAuthenticated,
      isLibrarian,
      isGuest,
      isAuthReady,
    }),
    [
      user,
      setAuthenticatedUser,
      updateUser,
      logout,
      isAuthenticated,
      isLibrarian,
      isGuest,
      isAuthReady,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
