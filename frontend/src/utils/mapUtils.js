/*
=========================================================
mapUtils.js

תיאור הקובץ:
מרכז את הגדרות האזורים ופונקציות המיקום
של מפת הספרייה.

הקובץ כולל:
- גבולות האזורים במפה.
- בדיקה אם נקודה נמצאת באזור מותר.
- איתור אזור לפי מיקום.
- הגבלת נקודה לגבולות אזור מסוים.

הפונקציות הן טהורות ואינן תלויות ב-React.
=========================================================
*/

/*
---------------------------------------------------------
mapZones

תפקיד:
מגדיר את האזורים המותרים להצבת פריטים במפה,
את גבולותיהם ואת מיקום כותרת כל אזור.
---------------------------------------------------------
*/
export const mapZones = [
  {
    id: "quiet-room",
    label: "Quiet Room",
    minX: 3,
    maxX: 34,
    minY: 16,
    maxY: 47,
    labelX: 18,
    labelY: 8,
  },
  {
    id: "computer-area",
    label: "Computer Area",
    minX: 38,
    maxX: 61,
    minY: 16,
    maxY: 42,
    labelX: 49,
    labelY: 8,
  },
  {
    id: "group-room",
    label: "Group Study Rooms",
    minX: 65,
    maxX: 97,
    minY: 16,
    maxY: 50,
    labelX: 81,
    labelY: 8,
  },
  {
    id: "reading-book",
    label: "Reading Book",
    minX: 2,
    maxX: 18,
    minY: 51,
    maxY: 80,
    labelX: 18,
    labelY: 57,
  },
  {
    id: "study-room-1",
    label: "Study Room 1",
    minX: 49,
    maxX: 63.5,
    minY: 54,
    maxY: 80,
    labelX: 57,
    labelY: 57,
  },
  {
    id: "study-room-2",
    label: "Study Room 2",
    minX: 65,
    maxX: 79.5,
    minY: 54,
    maxY: 80,
    labelX: 72,
    labelY: 57,
  },
  {
    id: "study-room-3",
    label: "Study Room 3",
    minX: 81.5,
    maxX: 98,
    minY: 54,
    maxY: 80,
    labelX: 89,
    labelY: 57,
  },
];

/*
---------------------------------------------------------
isInsideAllowedZone

תפקיד:
בודקת אם נקודת X ו-Y נמצאת בתוך לפחות
אחד מהאזורים המותרים במפה.
---------------------------------------------------------
*/
export const isInsideAllowedZone = (x, y) =>
  mapZones.some(
    (zone) =>
      x >= zone.minX && x <= zone.maxX && y >= zone.minY && y <= zone.maxY,
  );

/*
---------------------------------------------------------
getZoneByPosition

תפקיד:
מחזירה את האזור שבו נמצאת נקודת X ו-Y.
אם הנקודה אינה באזור מותר, מוחזר undefined.
---------------------------------------------------------
*/
export const getZoneByPosition = (x, y) =>
  mapZones.find(
    (zone) =>
      x >= zone.minX && x <= zone.maxX && y >= zone.minY && y <= zone.maxY,
  );

/*
---------------------------------------------------------
clampPositionToZone

תפקיד:
מגבילה נקודה לגבולות האזור הנתון,
כדי למנוע גרירת פריט אל מחוץ לאזור שלו.
---------------------------------------------------------
*/
export const clampPositionToZone = (x, y, zone) => {
  if (!zone) {
    return {
      x,
      y,
    };
  }

  return {
    x: Math.max(zone.minX, Math.min(zone.maxX, x)),
    y: Math.max(zone.minY, Math.min(zone.maxY, y)),
  };
};
