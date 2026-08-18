/*
=========================================================
BackButton.jsx

תיאור הקובץ:
כפתור חזרה משותף לדפים ולטפסים במערכת.

הקומפוננטה תומכת בשני מצבים:
- icon: חץ בלבד עבור Login ו-Register.
- page: חץ עם המילה Back עבור דפי המערכת.

אם אין עמוד קודם בהיסטוריה, המשתמש מועבר
לעמוד ברירת מחדל בהתאם לתפקיד שלו.
=========================================================
*/

import { useContext } from "react";
import PropTypes from "prop-types";
import { useLocation, useNavigate } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";

import "../../styles/back-button.css";

/*
---------------------------------------------------------
BackButton

תפקיד:
מחזירה לעמוד הקודם, או לעמוד ברירת מחדל
כאשר הדף נפתח ישירות.
---------------------------------------------------------
*/
export default function BackButton({ variant = "icon", fallbackPath = "" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const { isLibrarian } = useContext(AuthContext);

  /*
  -------------------------------------------------------
  handleBack

  תפקיד:
  משתמשת בהיסטוריית הניווט כאשר קיים עמוד קודם.

  כאשר המשתמש פתח את הקישור ישירות:
  - ספרנית חוזרת לדשבורד.
  - משתמש רגיל חוזר לדף הבית.
  -------------------------------------------------------
  */
  const handleBack = () => {
    const defaultPath =
      fallbackPath || (isLibrarian ? "/admin/librarian" : "/");

    if (location.key && location.key !== "default") {
      navigate(-1);
      return;
    }

    navigate(defaultPath);
  };

  const isPageButton = variant === "page";

  return (
    <button
      type="button"
      className={isPageButton ? "pageBackButton" : "backButton"}
      aria-label="Go back to the previous page"
      onClick={handleBack}
    >
      <span className="backButtonArrow" aria-hidden="true">
        ←
      </span>

      {isPageButton && <span className="backButtonText">Back</span>}
    </button>
  );
}

/*
---------------------------------------------------------
BackButton.propTypes

תפקיד:
מגדיר את סוג התצוגה ואת נתיב ברירת המחדל.
---------------------------------------------------------
*/
BackButton.propTypes = {
  variant: PropTypes.oneOf(["icon", "page"]),
  fallbackPath: PropTypes.string,
};
