/*
=========================================================
RoomMap.jsx

תיאור הקובץ:
קומפוננטת עטיפה למפת הספרייה.

הקומפוננטה אחראית על:
- טעינת פריטי המפה מה-Backend.
- רענון זמינות המושבים לפי תאריך ושעה.
- שמירת פריטי המפה במקור State מרכזי.
- העברת פעולות ונתונים ל-LibraryMap.
=========================================================
*/

import { useCallback, useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { useLocation } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";
import { buildApiUrl } from "../../config/api";
import LibraryMap from "../map/LibraryMap";

/*
---------------------------------------------------------
RoomMap

תפקיד:
טוענת את מפת הספרייה ומחברת אותה למצב המשתמש,
לתאריך ולשעת ההזמנה שנבחרו.
---------------------------------------------------------
*/
export default function RoomMap({
  selectedSeatId = null,
  onSeatSelect,
  selectedDate = "",
  selectedTime = "",
}) {
  const { isLibrarian } = useContext(AuthContext);
  const location = useLocation();

  const [items, setItems] = useState([]);
  const [internalSelectedSeatId, setInternalSelectedSeatId] =
    useState(selectedSeatId);

  /*
  ---------------------------------------------------------
  סנכרון המושב הנבחר

  תפקיד:
  מעדכן את הבחירה הפנימית כאשר הקומפוננטה האב
  משנה את selectedSeatId.
  ---------------------------------------------------------
  */
  useEffect(() => {
    setInternalSelectedSeatId(selectedSeatId);
  }, [selectedSeatId]);

  /*
  ---------------------------------------------------------
  handleSeatSelect

  תפקיד:
  שומרת את מזהה המושב שנבחר ומעבירה את פרטי
  המושב לקומפוננטה האב.
  ---------------------------------------------------------
  */
  const handleSeatSelect = useCallback(
    (seatData) => {
      const newSeatId = seatData ? (seatData.seatId ?? seatData.id) : null;

      setInternalSelectedSeatId(newSeatId);

      if (onSeatSelect) {
        onSeatSelect(seatData);
      }
    },
    [onSeatSelect],
  );

  /*
  ---------------------------------------------------------
  fetchSeats

  תפקיד:
  טוענת מהשרת את פריטי המפה ואת מצב זמינות המושבים
  לפי התאריך והשעה שנבחרו.

  useCallback:
  שומרת על אותה הפניה לפונקציה כל עוד התאריך
  והשעה לא השתנו.
  ---------------------------------------------------------
  */
  const fetchSeats = useCallback(async () => {
    try {
      const response = await axios.get(buildApiUrl("/seats/get-map"), {
        params: {
          date: selectedDate || undefined,
          time: selectedTime || undefined,
        },
        withCredentials: true,
      });

      const mapData =
        response.data.map ||
        (Array.isArray(response.data) ? response.data : []);

      setItems(mapData);
    } catch (error) {
      console.error("Error fetching library map:", error);

      setItems([]);
    }
  }, [selectedDate, selectedTime]);

  /*
  ---------------------------------------------------------
  טעינת המפה

  תפקיד:
  טוענת מחדש את המפה בכל פעם שהתאריך או השעה
  משתנים באמצעות fetchSeats המעודכנת.
  ---------------------------------------------------------
  */
  useEffect(() => {
    fetchSeats();
  }, [fetchSeats]);

  const isManagementMapPage =
    location.pathname === "/map" || location.pathname === "/admin/map";

  const canManageMap = isLibrarian && isManagementMapPage;

  return (
    <LibraryMap
      isLibrarian={canManageMap}
      items={items}
      setItems={setItems}
      fetchLatestSeats={fetchSeats}
      selectedSeatId={internalSelectedSeatId}
      onSeatSelect={handleSeatSelect}
    />
  );
}

RoomMap.propTypes = {
  selectedSeatId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onSeatSelect: PropTypes.func,
  selectedDate: PropTypes.string,
  selectedTime: PropTypes.string,
};
