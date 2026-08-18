/*
=========================================================
Header.jsx

תיאור הקובץ:
סרגל הניווט העליון של המערכת.

הקובץ כולל:
- ניווט בין דפי המערכת.
- תפריט רספונסיבי למסכים צרים.
- הצגת שם המשתמש ותמונת הפרופיל.
- תפריט פרופיל מותאם למשתמש ולספרנית.
- התנתקות מהמערכת.
- תמיכה במקלדת ובקוראי מסך.
=========================================================
*/

import { useContext, useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";
import { getProfileImageSrc } from "../../utils/profileImage";

import "../../styles/header.css";

/*
---------------------------------------------------------
Header

תפקיד:
מציגה את סרגל הניווט הראשי ואת תפריטי
הניווט והפרופיל.
---------------------------------------------------------
*/
export default function Header() {
  const { user, isAuthenticated, isLibrarian, logout } =
    useContext(AuthContext);

  const location = useLocation();

  const headerRef = useRef(null);
  const menuButtonRef = useRef(null);
  const profileButtonRef = useRef(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const displayName = user?.fullName || user?.name || "Library User";

  const navClassName = ({ isActive }) =>
    isActive ? "navItem activeNav" : "navItem";

  const profileLinkClassName = ({ isActive }) =>
    isActive ? "profileMenuItem activeProfileMenuItem" : "profileMenuItem";

  /*
  -------------------------------------------------------
  סגירת התפריטים לאחר מעבר לעמוד אחר
  -------------------------------------------------------
  */
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

  /*
  -------------------------------------------------------
  סגירת התפריטים באמצעות Escape או לחיצה מחוץ ל-Header
  -------------------------------------------------------
  */
  useEffect(() => {
    if (!isMenuOpen && !isProfileMenuOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key !== "Escape") {
        return;
      }

      if (isProfileMenuOpen) {
        setIsProfileMenuOpen(false);
        profileButtonRef.current?.focus();
        return;
      }

      if (isMenuOpen) {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    const handlePointerDown = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setIsMenuOpen(false);
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isMenuOpen, isProfileMenuOpen]);

  /*
  -------------------------------------------------------
  handleMainMenuToggle

  תפקיד:
  פותחת או סוגרת את תפריט הניווט הרספונסיבי.
  -------------------------------------------------------
  */
  const handleMainMenuToggle = () => {
    setIsMenuOpen((currentValue) => !currentValue);
    setIsProfileMenuOpen(false);
  };

  /*
  -------------------------------------------------------
  handleProfileMenuToggle

  תפקיד:
  פותחת או סוגרת את תפריט הפרופיל.
  -------------------------------------------------------
  */
  const handleProfileMenuToggle = () => {
    setIsProfileMenuOpen((currentValue) => !currentValue);
  };

  /*
  -------------------------------------------------------
  handleLogout

  תפקיד:
  סוגרת את כל התפריטים ומפעילה התנתקות.
  -------------------------------------------------------
  */
  const handleLogout = () => {
    setIsMenuOpen(false);
    setIsProfileMenuOpen(false);
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
        onClick={handleMainMenuToggle}
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
            <div className="headerProfileMenu">
              {/*
              =============================================
              כפתור פתיחת תפריט הפרופיל
              =============================================
              */}

              <button
                ref={profileButtonRef}
                type="button"
                className="headerProfileMenuButton"
                aria-label={`Open profile menu for ${displayName}`}
                aria-haspopup="menu"
                aria-expanded={isProfileMenuOpen}
                aria-controls="header-profile-menu"
                onClick={handleProfileMenuToggle}
              >
                <span className="headerUserName">{displayName}</span>

                <img
                  src={getProfileImageSrc(user)}
                  alt=""
                  aria-hidden="true"
                  className="headerProfileImage"
                />

                <span
                  className={`profileMenuChevron ${
                    isProfileMenuOpen ? "profileMenuChevronOpen" : ""
                  }`}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>

              {/*
              =============================================
              רשימת פעולות הפרופיל
              =============================================
              */}

              {isProfileMenuOpen && (
                <div
                  id="header-profile-menu"
                  className="profileDropdownMenu"
                  role="menu"
                  aria-label="Profile actions"
                >
                  <div className="profileDropdownIdentity">
                    <strong>{displayName}</strong>

                    {user?.email && <span>{user.email}</span>}

                    <small>{isLibrarian ? "Librarian" : "Library User"}</small>
                  </div>

                  <div className="profileDropdownDivider" />

                  <NavLink
                    to="/profile"
                    className={profileLinkClassName}
                    role="menuitem"
                  >
                    <span aria-hidden="true">👤</span>
                    My Profile
                  </NavLink>

                  {isLibrarian ? (
                    <NavLink
                      to="/admin/librarian"
                      className={profileLinkClassName}
                      role="menuitem"
                    >
                      <span aria-hidden="true">📊</span>
                      Librarian Dashboard
                    </NavLink>
                  ) : (
                    <NavLink
                      to="/my-reservations"
                      className={profileLinkClassName}
                      role="menuitem"
                    >
                      <span aria-hidden="true">📅</span>
                      My Reservations
                    </NavLink>
                  )}

                  <div className="profileDropdownDivider" />

                  <button
                    type="button"
                    className="profileMenuItem profileMenuLogout"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <span aria-hidden="true">↪</span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
