/*
  RoomMap.jsx
  -----------
  קובץ מעבר שמציג את המפה הדינמית החדשה.

  המטרה:
  - לשמור על התאמה לקבצים שכבר משתמשים ב-RoomMap
  - להשתמש בפועל ברכיב החדש LibraryMap
*/

import LibraryMap from "../map/LibraryMap";

export default function RoomMap({ isLibrarian = true }) {
  return <LibraryMap isLibrarian={isLibrarian} />;
}
