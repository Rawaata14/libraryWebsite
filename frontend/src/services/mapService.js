/*
=========================================================
mapService.js

תיאור הקובץ:
מרכז את בקשות ה-API הקשורות לעריכת מפת הספרייה.

השירות אחראי על:
- מחיקת פריט קיים מהמפה.
- שמירת כל מבנה המפה בשרת.

הקובץ מפריד את תקשורת השרת מלוגיקת React
ומשתמש בכתובת ה-API המרכזית של הפרויקט.
=========================================================
*/

import axios from "axios";

import { buildApiUrl } from "../config/api";

/*
---------------------------------------------------------
deleteMapItem

תפקיד:
מוחקת מהשרת פריט מפה קיים לפי מזהה המושב.
---------------------------------------------------------
*/
export const deleteMapItem = async (seatId) => {
  return axios.delete(buildApiUrl(`/seats/delete-seat/${seatId}`), {
    withCredentials: true,
  });
};

/*
---------------------------------------------------------
updateSeatStatus

תפקיד:
מעדכן את הסטטוס של כיסא מסוים (למשל blocked או available) בשרת.
---------------------------------------------------------
*/
export const updateSeatStatus = async (seatItem) => {
  return axios.put(buildApiUrl(`/seats/status/${seatItem.seatId}`), seatItem, {
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true,
  });
};

/*
---------------------------------------------------------
saveLibraryMap

תפקיד:
שולחת לשרת את כל פריטי המפה לשמירה.

פריטים זמניים נשלחים ללא seatId כדי שהשרת
יוכל ליצור עבורם מזהה קבוע.
---------------------------------------------------------
*/
export const saveLibraryMap = async (items) => {
  const itemsToSave = items.map((item) => ({
    ...item,
    seatId: String(item.seatId).startsWith("temp-") ? null : item.seatId,
  }));

  return axios.post(buildApiUrl("/seats/save-map"), itemsToSave, {
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true,
  });
};
