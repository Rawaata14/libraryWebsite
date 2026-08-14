/*
=========================================================
profileImage.js

תיאור הקובץ:
פונקציות עזר הקשורות להצגת תמונות פרופיל.

הקובץ מרכז במקום אחד את בניית כתובת תמונת המשתמש,
כדי למנוע כתיבת אותו קוד בכמה קומפוננטות.
=========================================================
*/

import { buildApiUrl } from "../config/api";

/*
---------------------------------------------------------
getProfileImageSrc

תפקיד:
מחזירה את כתובת תמונת הפרופיל של המשתמש.

אם המשתמש העלה תמונה:
מחזירה את כתובת התמונה השמורה בשרת.

אם אין למשתמש תמונה:
מחזירה את תמונת ברירת המחדל השמורה בפרויקט.
---------------------------------------------------------
*/
export function getProfileImageSrc(user) {
  if (user?.profile_image_name) {
    return buildApiUrl(`/uploads/profile-images/${user.profile_image_name}`);
  }

  if (user?.profileImage) {
    return user.profileImage;
  }

  return "/images/default-profile.png";
}
