/*
=========================================================
PageBanner.jsx

תיאור הקובץ:
כותרת עליונה משותפת לדפי המערכת.

הקומפוננטה אחראית על:
- הצגת כותרת ראשית ברורה לכל עמוד.
- שמירת מבנה סמנטי ונגיש.
- טעינת קובץ העיצוב הייעודי לכותרת.
=========================================================
*/
import { useLocation } from "react-router-dom";

import PropTypes from "prop-types";

import "../../styles/page-banner.css";
import BackButton from "../common/BackButton";

const PAGES_WITHOUT_BACK_BUTTON = ["/", "/home", "/dashboard"];
/*
---------------------------------------------------------
PageBanner

תפקיד:
מציגה את כותרת הדף ככותרת ראשית מסוג h1.
---------------------------------------------------------
*/
export default function PageBanner({ title }) {
  const location = useLocation();

  const shouldShowBackButton = !PAGES_WITHOUT_BACK_BUTTON.includes(
    location.pathname,
  );
  return (
    <div className="pageBanner">
      <div>
        {shouldShowBackButton && (
          <div className="pageBackButtonContainer">
            <BackButton variant="page" />
          </div>
        )}
      </div>
      <div className="pageBannerTitleContainer">
        <h1 className="pageBannerTitle">{title}</h1>
      </div>
    </div>
  );
}

/*
---------------------------------------------------------
PageBanner.propTypes

תפקיד:
מגדיר את כותרת הדף שהקומפוננטה מקבלת.
---------------------------------------------------------
*/
PageBanner.propTypes = {
  title: PropTypes.string.isRequired,
};
