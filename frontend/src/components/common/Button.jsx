/*
=========================================================
Button.jsx

תיאור הקובץ:
קומפוננטת כפתור משותפת לכל המערכת.

הקומפוננטה אחראית על:
- הצגת כפתורים בעיצוב אחיד.
- תמיכה בסוגים ובווריאציות שונות.
- העברת מאפייני HTML נוספים לכפתור.
=========================================================
*/

import PropTypes from "prop-types";

/*
---------------------------------------------------------
Button

תפקיד:
מציגה כפתור כללי שניתן להשתמש בו בטפסים,
בפעולות ניהול ובניווט בתוך המערכת.

restButtonProps:
מכיל מאפיינים נוספים כמו:
- disabled
- aria-label
- title
---------------------------------------------------------
*/
export default function Button({
  children,
  variant = "primary",
  type = "button",
  onClick,
  className = "",
  ...restButtonProps
}) {
  const buttonClassName = `btn btn-${variant} ${className}`.trim();

  return (
    <button
      {...restButtonProps}
      type={type}
      className={buttonClassName}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/*
---------------------------------------------------------
Button.propTypes

תפקיד:
מגדיר את סוגי ה-Props שכפתור משותף יכול לקבל.
---------------------------------------------------------
*/
Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.string,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  onClick: PropTypes.func,
  className: PropTypes.string,
};
