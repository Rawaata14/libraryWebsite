/*
=========================================================
PageShell.jsx

תיאור הקובץ:
מעטפת משותפת לכל דפי המערכת.

הקומפוננטה אחראית על:
- הצגת Header קבוע (עם אפשרות הסתרה).
- הצגת סרגל ספרנית למשתמשת מורשית (עם אפשרות הסתרה).
- הצגת כפתור חזרה בדפים פנימיים.
- הצגת תוכן הדף.
- הצגת Footer קבוע (עם אפשרות הסתרה).
=========================================================
*/

import { useContext } from "react";
import PropTypes from "prop-types";
import { useLocation } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";

import BackButton from "../common/BackButton";
import Footer from "./Footer";
import Header from "./Header";
import LibrarianSidebar from "./LibrarianSidebar";

/*
---------------------------------------------------------
PAGES_WITHOUT_BACK_BUTTON

תפקיד:
מגדיר את העמודים הראשיים שבהם אין צורך
להציג כפתור חזרה.
---------------------------------------------------------
*/
const PAGES_WITHOUT_BACK_BUTTON = [
  "/",
  "/admin/librarian",
  "/login",
  "/register",
];

/*
---------------------------------------------------------
PageShell

תפקיד:
עוטפת את תוכן הדף בין ה-Header ל-Footer,
מציגה סרגל ספרנית וכפתור חזרה בדפים פנימיים.
מאפשרת גם הסתרה של רכיבים דרך Props לפי צורך.
---------------------------------------------------------
*/
export default function PageShell({ children, hideSidebar = false }) {
  const { isLibrarian } = useContext(AuthContext);
  const location = useLocation();

  const shouldShowBackButton = !PAGES_WITHOUT_BACK_BUTTON.includes(
    location.pathname,
  );

  return (
    <div className="pageShell">
      <div className="frame libraryBg">
        <Header />

        <div className="pageShellBody">
          {/* מציג את הסרגל רק אם המשתמשת ספרנית וגם לא ביקשו להסתיר */}
          {isLibrarian && !hideSidebar && <LibrarianSidebar />}

          <main className="pageShellContent">
            

            {children}
          </main>
        </div>

        <Footer />
      </div>
    </div>
  );
}

/*
---------------------------------------------------------
PageShell.propTypes

תפקיד:
מגדיר את סוגי הנתונים (PropTypes) עבור המעטפת וה-Props החדשים.
---------------------------------------------------------
*/
PageShell.propTypes = {
  children: PropTypes.node.isRequired,
  hideHeader: PropTypes.bool,
  hideFooter: PropTypes.bool,
  hideSidebar: PropTypes.bool,
};
