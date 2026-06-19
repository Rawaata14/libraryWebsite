/*
  AuthContext.jsx
  ---------------
  קונטקסט גלובלי לניהול מצב ההתחברות של המשתמש.

  אחריות:
  - לשמור את נתוני המשתמש המחובר
  - לספק פעולות התחברות, הרשמה, עדכון משתמש והתנתקות
  - לאפשר גישה לנתוני המשתמש מכל מקום במערכת
*/

import { createContext, useEffect, useMemo, useState } from "react";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("http://localhost:8000/user/check-auth", {
          credentials: "include",
        });
        if (response.ok) {
          const userData = await response.json();

          // 💡 בדיקה קריטית: תפתחי את ה-Console בדפדפן (F12) ותראי מה מודפס כאן!
          console.log("This is the exact data from check-auth:", userData);

          // בדיקה אם המשתמש מגיע ישירות או עטוף בתוך שדה user
          if (userData.user) {
            setUser(userData.user);
          } else if (userData.data) {
            setUser(userData.data);
          } else {
            setUser(userData);
          }
        } else {
          setUser(null);
          localStorage.removeItem("libraryUser");
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setUser(null);
        localStorage.removeItem("libraryUser");
      }
      setIsAuthReady(true);
    };
    checkAuth();
  }, []);
  // const storedUser = localStorage.getItem("libraryUser");

  // if (storedUser) {
  //   try {
  //     setUser(JSON.parse(storedUser));
  //   } catch (error) {
  //     console.error("שגיאה בקריאת נתוני המשתמש:", error);
  //     localStorage.removeItem("libraryUser");
  //   }
  // }

  // setIsAuthReady(true);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("libraryUser", JSON.stringify(userData));
  };

  const register = (userData) => {
    setUser(userData);
    localStorage.setItem("libraryUser", JSON.stringify(userData));
  };

  const updateUser = (updatedData) => {
    setUser((prevUser) => {
      const nextUser = { ...prevUser, ...updatedData };
      localStorage.setItem("libraryUser", JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const logout = async () => {
    try {
      // 💡 פונים לשרת ומבקשים ממנו להרוס את הסשן ולמחוק את העוגייה
      await fetch("http://localhost:8000/user/logout", {
        method: "POST",
        credentials: "include", // 💡 קריטי! גורם לדפדפן להעביר את העוגייה לשרת כדי שידע מי מתנתק
      });
    } catch (error) {
      console.error("Error during server logout:", error);
    } finally {
      // 💡 בין אם השרת הצליח ובין אם לא, מנקים את הדפדפן ומחזירים לדף הבית
      setUser(null);
      localStorage.removeItem("libraryUser");
      window.location.href = "/";
    }
  };

  const isAuthenticated = !!user;
  const isLibrarian = user?.role === "librarian";
  const isGuest = !user;

  const value = useMemo(() => {
    return {
      user,
      setUser,
      login,
      register,
      updateUser,
      logout,
      isAuthenticated,
      isLibrarian,
      isGuest,
      isAuthReady,
    };
  }, [user, isAuthenticated, isLibrarian, isGuest, isAuthReady]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
