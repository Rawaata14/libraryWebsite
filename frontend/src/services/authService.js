/*
=========================================================
authService.js

תיאור הקובץ:
מרכז את בקשות ה-API הקשורות לאימות המשתמש.

השירות אחראי בשלב זה על:
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
