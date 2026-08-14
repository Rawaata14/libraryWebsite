/*
=========================================================
UserRow.jsx

תיאור הקובץ:
מציג שורת משתמש אחת בטבלת ניהול המשתמשים.

הקומפוננטה אחראית על:
- הצגת פרטי המשתמש ותמונת הפרופיל.
- הצגת התפקיד והסטטוס.
- הצגת תאריכי יצירה והתחברות.
- הפעלת חסימה או הפעלה מחדש של המשתמש.
=========================================================
*/

import PropTypes from "prop-types";

import { userPropType } from "../../propTypes/profilePropTypes";
import { getProfileImageSrc } from "../../utils/profileImage";

/*
---------------------------------------------------------
formatUserDate

תפקיד:
ממירה תאריך שמתקבל מהשרת לתאריך מקומי
קריא, או מחזירה ערך חלופי אם התאריך חסר.
---------------------------------------------------------
*/
const formatUserDate = (dateValue, fallbackValue) => {
  if (!dateValue) {
    return fallbackValue;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return fallbackValue;
  }

  return date.toLocaleDateString();
};

/*
---------------------------------------------------------
UserRow

תפקיד:
מציגה משתמש אחד ומעבירה לעמוד האב
את בקשת שינוי הסטטוס שלו.
---------------------------------------------------------
*/
export default function UserRow({ user, onStatusChange }) {
  const isActive = user.status === "active";
  const nextStatus = isActive ? "blocked" : "active";

  return (
    <tr>
      <td>
        <img
          className="userProfileImage"
          src={getProfileImageSrc(user)}
          alt={user.fullName || user.email}
        />
      </td>

      <td>{user.fullName || "-"}</td>
      <td>{user.email}</td>
      <td>{user.phone || "-"}</td>
      <td>{user.role || "-"}</td>

      <td>
        <span
          className={`userStatus ${
            isActive ? "statusActive" : "statusBlocked"
          }`}
        >
          {user.status || "unknown"}
        </span>
      </td>

      <td>{formatUserDate(user.createdAt, "-")}</td>

      <td>{formatUserDate(user.lastLoginAt, "Never")}</td>

      <td>
        <button
          type="button"
          className={isActive ? "blockUserButton" : "activateUserButton"}
          onClick={() => onStatusChange(user.email, nextStatus)}
        >
          {isActive ? "Block" : "Activate"}
        </button>
      </td>
    </tr>
  );
}

/*
---------------------------------------------------------
UserRow.propTypes

תפקיד:
מגדיר את פרטי המשתמש ואת פעולת שינוי הסטטוס.
---------------------------------------------------------
*/
UserRow.propTypes = {
  user: userPropType.isRequired,
  onStatusChange: PropTypes.func.isRequired,
};
