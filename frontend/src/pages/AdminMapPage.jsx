/*
  AdminMapPage.jsx
  ----------------
  דף ניהול ועריכת מפת הספרייה עבור הספרנית.

  אחריות:
  - טעינת מצב המפה הקיים מבסיס הנתונים בעת כניסת הספרנית.
  - הצגת רכיב המפה הדינמי במצב עריכה מלא (isLibrarian={true}).
  - ניהול ה-State הראשי של פריטי המפה (items) והזרמתו לרכיב המפה.
*/

import { useState, useEffect } from "react";
import PageShell from "../components/layout/PageShell";
import PageBanner from "../components/layout/PageBanner";
import LibraryMap from "../components/map/LibraryMap";
import axios from "axios";

export default function AdminMapPage() {
  const [items, setItems] = useState([
    {
      seatId: "test-1",
      type: "single-seat",
      x: 50,
      y: 50,
      rotation: 0,
      status: "available",
    },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  // טעינת נתוני המפה מהשרת מיד כשהעמוד עולה
  useEffect(() => {
    const fetchMapData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          "http://localhost:8000/seats/get-map",
          {
            withCredentials: true, // שומר על ה-session של הספרנית המחוברת
          },
        );
        console.log("This is what comes from the backend:", response.data);
        if (response.status === 200) {
          const mapData =
            response.data.map ||
            (Array.isArray(response.data) ? response.data : []);
          setItems(mapData);
        }
      } catch (error) {
        console.error("Error fetching map data:", error);
        alert("שגיאה בטעינת נתוני המפה מהשרת");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMapData();
  }, []);

  return (
    <PageShell userType="librarian">
      <PageBanner title="Design & Manage Library Map" />

      <div className="adminMapPageContainer" style={{ padding: "20px" }}>
        {isLoading ? (
          <div
            className="loadingMessage"
            style={{ textAlign: "center", padding: "40px" }}
          >
            טוען את מפת הספרייה...
          </div>
        ) : (
          /* מעבירים ל-LibraryMap את ה-items וה-setItems שהרמנו לאבא,
            ומגדירים isLibrarian={true} כדי לפתוח את אפשרויות הגרירה, העריכה והשמירה.
          */
          <LibraryMap items={items} setItems={setItems} isLibrarian={true} />
        )}
      </div>
    </PageShell>
  );
}
