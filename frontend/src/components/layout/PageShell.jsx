/*
=========================================================
PageShell.jsx

תיאור הקובץ:
מעטפת משותפת לכל דפי המערכת.

הקומפוננטה אחראית על:
- הצגת Header קבוע.
- הצגת תוכן הדף.
- הצגת Footer קבוע.
- שמירה על מבנה אחיד בכל המערכת.
=========================================================
*/

import PropTypes from "prop-types";

import Header from "./Header";
import Footer from "./Footer";

/*
---------------------------------------------------------
PageShell

תפקיד:
עוטפת את תוכן הדף בין ה-Header ל-Footer.

נתוני המשתמש אינם מועברים כ-Props:
Header מקבלת אותם ישירות מ-AuthContext.
---------------------------------------------------------
*/
export default function PageShell({ children }) {
  return (
    <div className="pageShell">
      <div className="frame libraryBg">
        <Header />
        {children}
        <Footer />
      </div>
    </div>
  );
}

PageShell.propTypes = {
  children: PropTypes.node.isRequired,
};
