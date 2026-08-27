/*
=========================================================
notificationService.js

תיאור הקובץ:
מרכז את בקשות ה-API הקשורות להתראות.

השירות אחראי על:
- שליפת כל ההתראות של המשתמש המחובר.
- סימון התראה אחת כנקראה.
- סימון כל ההתראות כנקראו.
=========================================================
*/

import axios from "axios";

import { buildApiUrl } from "../config/api";

/*
---------------------------------------------------------
getNotifications

תפקיד:
שולפת את כל ההתראות השייכות למשתמש המחובר.

השרת מזהה את המשתמש באמצעות ה-Session,
ולכן אין צורך לשלוח userId מה-Frontend.
---------------------------------------------------------
*/
export async function getNotifications() {
  const response = await axios.get(buildApiUrl("/notifications"), {
    withCredentials: true,
  });

  return response.data;
}

/*
---------------------------------------------------------
markNotificationAsRead

תפקיד:
מסמנת התראה אחת כנקראה.
---------------------------------------------------------
*/
export async function markNotificationAsRead(notificationId) {
  const response = await axios.patch(
    buildApiUrl(`/notifications/${notificationId}/read`),
    {},
    {
      withCredentials: true,
    },
  );

  return response.data;
}

/*
---------------------------------------------------------
markAllNotificationsAsRead

תפקיד:
מסמנת את כל ההתראות של המשתמש המחובר
כנקראו.
---------------------------------------------------------
*/
export async function markAllNotificationsAsRead() {
  const response = await axios.patch(
    buildApiUrl("/notifications/read-all"),
    {},
    {
      withCredentials: true,
    },
  );

  return response.data;
}
