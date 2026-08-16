/*
=========================================================
authService.js

תיאור הקובץ:
מרכז את בקשות ה-API הקשורות לאימות המשתמש.

השירות אחראי בשלב זה על:
- בדיקת Session פעיל.
- ביצוע התנתקות מהמערכת.
- התחברות משתמש.
- הרשמת משתמש חדש.
- בדיקת Session פעיל.
- ביצוע התנתקות מהמערכת.
=========================================================
*/

import axios from "axios";

import { buildApiUrl } from "../config/api";

/*
---------------------------------------------------------
checkAuthentication

תפקיד:
בודקת מול השרת אם קיים Session פעיל
ומחזירה את נתוני המשתמש המחובר.
---------------------------------------------------------
*/
export const checkAuthentication = async () => {
  return axios.get(buildApiUrl("/user/check-auth"), {
    withCredentials: true,
  });
};

/*
---------------------------------------------------------
logoutUser

תפקיד:
מבקשת מהשרת למחוק את ה-Session הפעיל.
---------------------------------------------------------
*/
export const logoutUser = async () => {
  return axios.post(
    buildApiUrl("/user/logout"),
    {},
    {
      withCredentials: true,
    },
  );
};

/*
---------------------------------------------------------
loginUser

תפקיד:
שולחת לשרת את פרטי ההתחברות
ומחזירה את המשתמש המחובר.
---------------------------------------------------------
*/
export const loginUser = async ({
  email,
  password,
}) => {
  return axios.post(
    buildApiUrl("/user/login"),
    {
      email,
      password,
    },
    {
      withCredentials: true,
    },
  );
};

/*
---------------------------------------------------------
registerUser

תפקיד:
שולחת לשרת את פרטי המשתמש החדש
ומחזירה את המשתמש שנוצר והתחבר.
---------------------------------------------------------
*/
export const registerUser = async ({
  fullName,
  email,
  password,
  phone,
  address,
}) => {
  return axios.post(
    buildApiUrl("/user/register"),
    {
      fullName,
      email,
      password,
      phone,
      address,
    },
    {
      withCredentials: true,
    },
  );
};