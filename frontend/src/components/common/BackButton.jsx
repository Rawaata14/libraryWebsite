/*
=========================================================
BackButton.jsx

תיאור הקובץ:
כפתור חזרה משותף לדפים ולטפסים במערכת.

הכפתור מחזיר את המשתמש לעמוד הקודם
באמצעות React Router.
=========================================================
*/

import { useNavigate } from "react-router-dom";

/*
---------------------------------------------------------
BackButton

תפקיד:
מחזירה את המשתמש לעמוד הקודם בהיסטוריית הניווט.
---------------------------------------------------------
*/
export default function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="backButton"
      aria-label="Go back"
      onClick={() => navigate(-1)}
    >
      ←
    </button>
  );
}
