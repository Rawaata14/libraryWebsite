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

import { checkAuthentication, logoutUser } from "../services/authService";

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
בודקת אם קיים Session פעיל ושומרת
את המשתמש המחובר ב-Context.

משתנה isComponentActive מונע עדכון State
לאחר שה-Provider ירד מהמסך.
---------------------------------------------------------
*/
  useEffect(() => {
    let isComponentActive = true;

    const loadAuthenticatedUser = async () => {
      try {
        const response = await checkAuthentication();

        if (isComponentActive) {
          setUser(response.data);
        }
      } catch (error) {
        if (!isComponentActive) {
          return;
        }

        setUser(null);

        /*
        תשובת 401 היא מצב רגיל עבור אורח,
        ולכן אין צורך להציג אותה כשגיאת מערכת.
      */
        if (error.response?.status !== 401) {
          console.error("Error checking authentication:", error);
        }
      } finally {
        if (isComponentActive) {
          setIsAuthReady(true);
        }
      }
    };

    loadAuthenticatedUser();

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
מבקשת מהשרת למחוק את ה-Session
ומנקה תמיד את המשתמש מה-Context.
---------------------------------------------------------
*/
  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error("Error during logout:", error);
      }
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
