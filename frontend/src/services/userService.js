/*
=========================================================
userService.js

תיאור הקובץ:
מרכז את בקשות ה-API הקשורות לניהול משתמשים.

השירות אחראי על:
- שליפת רשימת המשתמשים.
- שינוי סטטוס משתמש.

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
