/*
=========================================================
profilePropTypes.js

תיאור הקובץ:
מרכז את מבנה המשתמש ואת מבנה טופס עריכת הפרופיל,
כדי לאפשר שימוש משותף ברכיבי הפרופיל.
=========================================================
*/

import PropTypes from "prop-types";

/*
---------------------------------------------------------
userPropType

תפקיד:
מגדיר את מבנה המשתמש שמתקבל ממערכת ההתחברות.
---------------------------------------------------------
*/
export const userPropType = PropTypes.shape({
  userId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  fullName: PropTypes.string,
  name: PropTypes.string,
  email: PropTypes.string,
  phone: PropTypes.string,
  address: PropTypes.string,
  role: PropTypes.string,
  profileImage: PropTypes.string,
  profile_image_name: PropTypes.string,
  status: PropTypes.string,
  createdAt: PropTypes.string,
  lastLoginAt: PropTypes.string,
});

/*
---------------------------------------------------------
profileFormPropType

תפקיד:
מגדיר את השדות הנשמרים בטופס עריכת פרטי המשתמש.
---------------------------------------------------------
*/
export const profileFormPropType = PropTypes.shape({
  fullName: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  phone: PropTypes.string.isRequired,
  address: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
  confirmPassword: PropTypes.string.isRequired,
});
