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
          setUser(userData);
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
    }
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

  const logout = () => {
    setUser(null);
    setIsAuthReady(true);
    localStorage.removeItem("libraryUser");
    window.location.href = "/";
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
