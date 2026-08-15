/*
=========================================================
PageBanner.jsx

תיאור הקובץ:
כותרת עליונה משותפת לדפי המערכת.
=========================================================
*/

import PropTypes from "prop-types";

/*
---------------------------------------------------------
PageBanner

תפקיד:
מציגה את כותרת הדף במבנה ובעיצוב אחידים.
---------------------------------------------------------
*/
export default function PageBanner({ title }) {
  return <div className="pageBanner">{title}</div>;
}

PageBanner.propTypes = {
  title: PropTypes.string.isRequired,
};
