/*
=========================================================
PageShell.jsx

תיאור הקובץ:
מעטפת משותפת לדפי המערכת.

הקומפוננטה אחראית על:
- הצגת Header קבוע.
- הצגת סרגל הספרנית למשתמשת מורשית.
- הצגת תוכן העמוד.
- הצגת Footer קבוע.

כפתור החזרה מוצג ברמת כותרת העמוד ולא מתוך
המעטפת, ולכן אינו מנוהל בקובץ זה.
=========================================================
*/

import { useContext } from "react";
import PropTypes from "prop-types";

import { AuthContext } from "../../context/AuthContext";

import Footer from "./Footer";
import Header from "./Header";
import LibrarianSidebar from "./LibrarianSidebar";

/*
---------------------------------------------------------
PageShell

תפקיד:
עוטפת את תוכן הדף בין ה-Header ל-Footer.

אם המשתמשת היא ספרנית, מוצג גם סרגל הניהול
האנכי, אלא אם התקבל hideSidebar בערך true.
---------------------------------------------------------
*/
export default function PageShell({ children, hideSidebar = false }) {
  const { isLibrarian } = useContext(AuthContext);

  return (
    <div className="pageShell">
      <div className="frame libraryBg">
        <Header />

        <div className="pageShellBody">
          {/* הצגת סרגל הניהול רק לספרנית ובהתאם להגדרת העמוד */}
          {isLibrarian && !hideSidebar && <LibrarianSidebar />}

          <main className="pageShellContent">{children}</main>
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
מגדיר את סוגי הנתונים שהקומפוננטה מקבלת.
---------------------------------------------------------
*/
PageShell.propTypes = {
  children: PropTypes.node.isRequired,
  hideSidebar: PropTypes.bool,
};
