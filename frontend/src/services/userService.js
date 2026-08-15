/*
=========================================================
userService.js

תיאור הקובץ:
מרכז את בקשות ה-API הקשורות לניהול משתמשים.

השירות אחראי על:
- שליפת רשימת המשתמשים.
- שינוי סטטוס משתמש.
- העלאת תמונת פרופיל.
- עדכון פרטי המשתמש המחובר.

ריכוז הבקשות מפריד בין תקשורת השרת
לבין רכיבי התצוגה של React.
=========================================================
*/

import axios from "axios";

import { buildApiUrl } from "../config/api";

/*
---------------------------------------------------------
getAllUsers

תפקיד:
שולפת מהשרת את רשימת המשתמשים.
ה-Backend בודק את ה-session ואת הרשאות הספרן.
---------------------------------------------------------
*/
export const getAllUsers = async () => {
  return axios.get(buildApiUrl("/user/all"), {
    withCredentials: true,
  });
};

/*
---------------------------------------------------------
updateUserStatus

תפקיד:
מעדכנת סטטוס משתמש לפי כתובת האימייל שלו.

הסטטוס יכול להיות:
- active
- blocked
---------------------------------------------------------
*/
export const updateUserStatus = async (email, status) => {
  return axios.put(
    buildApiUrl("/user/status"),
    {
      email,
      status,
    },
    {
      withCredentials: true,
    },
  );
};

/*
---------------------------------------------------------
updateProfileImage

תפקיד:
שולחת תמונת פרופיל חדשה לשרת באמצעות FormData.
---------------------------------------------------------
*/
export const updateProfileImage = async (
  imageFile,
) => {
  const imageFormData = new FormData();

  imageFormData.append(
    "profileImage",
    imageFile,
  );

  return axios.put(
    buildApiUrl("/user/profile-image"),
    imageFormData,
    {
      withCredentials: true,
    },
  );
};

/*
---------------------------------------------------------
updateProfileDetails

תפקיד:
שולחת לשרת את פרטי הפרופיל המעודכנים
של המשתמש המחובר.
---------------------------------------------------------
*/
export const updateProfileDetails = async (
  profileDetails,
) => {
  return axios.put(
    buildApiUrl("/user/profile"),
    profileDetails,
    {
      withCredentials: true,
    },
  );
};
