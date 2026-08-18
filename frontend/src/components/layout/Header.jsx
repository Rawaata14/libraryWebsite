/*
=========================================================
Header.jsx

תיאור הקובץ:
סרגל הניווט העליון של המערכת.

הקובץ כולל:
- ניווט בין דפי המערכת.
- תפריט רספונסיבי למסכים צרים.
- הצגת משתמש מחובר ותמונת פרופיל.
- מעבר לדף הפרופיל.
- התנתקות מהמערכת.
- תמיכה במקלדת ובקוראי מסך.
=========================================================
*/

import { useContext, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";
import { getProfileImageSrc } from "../../utils/profileImage";

import "../../styles/header.css";
/*
---------------------------------------------------------
Header

תפקיד:
מציגה את סרגל הניווט הראשי ומתאימה אותו
למסך מלא, חצי מסך וטלפון.
---------------------------------------------------------
*/
export default function Header() {
  const { user, isAuthenticated, isLibrarian, logout } =
    useContext(AuthContext);

  const location = useLocation();

  const headerRef = useRef(null);
  const menuButtonRef = useRef(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navClassName = ({ isActive }) =>
    isActive ? "navItem activeNav" : "navItem";

  /*
  -------------------------------------------------------
  סגירת התפריט לאחר מעבר לעמוד אחר
  -------------------------------------------------------
  */
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  /*
  -------------------------------------------------------
  סגירת התפריט באמצעות Escape או לחיצה מחוץ ל-Header
  -------------------------------------------------------
  */
  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    const handlePointerDown = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isMenuOpen]);

  /*
  -------------------------------------------------------
  handleLogout

  תפקיד:
  סוגרת את התפריט ומפעילה את פעולת ההתנתקות.
  -------------------------------------------------------
  */
  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
  };

  return (
    <header ref={headerRef} className="topbar">
      <NavLink to="/" className="brand" aria-label="Library home page">
        <span className="brandIcon" aria-hidden="true">
          📖
        </span>

        <span>Library</span>
      </NavLink>

      {/*
      ===================================================
      כפתור פתיחת התפריט במסכים צרים
      ===================================================
      */}

      <button
        ref={menuButtonRef}
        type="button"
        className="headerMenuToggle"
        aria-label={
          isMenuOpen ? "Close navigation menu" : "Open navigation menu"
        }
        aria-expanded={isMenuOpen}
        aria-controls="main-navigation-menu"
        onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
      >
        <span aria-hidden="true">{isMenuOpen ? "×" : "☰"}</span>
      </button>

      {/*
      ===================================================
      תפריט הניווט ופעולות המשתמש
      ===================================================
      */}

      <div
        id="main-navigation-menu"
        className={`headerMenu ${isMenuOpen ? "headerMenuOpen" : ""}`}
      >
        <nav className="navLinks" aria-label="Main navigation">
          <NavLink to="/" className={navClassName}>
            Home
          </NavLink>

          {isLibrarian && (
            <NavLink to="/admin/librarian" className={navClassName}>
              Dashboard
            </NavLink>
          )}

          <NavLink
            to={isLibrarian ? "/admin/map" : "/map"}
            className={navClassName}
          >
            Study Rooms
          </NavLink>

          <NavLink
            to={isLibrarian ? "/admin/books" : "/books"}
            className={navClassName}
          >
            Books
          </NavLink>

          <NavLink to="/events" className={navClassName}>
            Events
          </NavLink>

          <NavLink to="/about" className={navClassName}>
            About Us
          </NavLink>
        </nav>

        <div className="headerActions">
          {!isAuthenticated ? (
            <NavLink to="/login" className="headerLoginBtn">
              Login / Sign Up
            </NavLink>
          ) : (
            <>
              <div className="headerProfileSection">
                <span className="headerWelcomeText">
                  Welcome {user?.fullName || user?.name || "Library User"}
                </span>

                <Link
                  to="/profile"
                  className="profileImageLink"
                  aria-label="Open your profile"
                >
                  <img
                    src={getProfileImageSrc(user)}
                    alt=""
                    aria-hidden="true"
                    className="headerProfileImage"
                  />
                </Link>
              </div>

              <button
                type="button"
                className="headerLogoutBtn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
