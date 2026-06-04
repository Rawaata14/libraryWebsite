/*
  AdminMapPage.jsx
  ----------------
  דף ניהול ועריכת מפת הספרייה עבור הספרנית.
*/

import PageShell from "../components/layout/PageShell";
import PageBanner from "../components/layout/PageBanner";
import RoomMap from "../components/dashboard/RoomMap"; // 💡 יבוא העטיפה החכמה

export default function AdminMapPage() {
  return (
    <PageShell userType="librarian">
      <PageBanner title="Design & Manage Library Map" />

      <div className="adminMapPageContainer" style={{ padding: "20px" }}>
        {/* 🔥 קריאה פשוטה ונקייה לעטיפה!
          העטיפה מזהה אוטומטית לפי ה-URL (pathname === "/admin/map") שזה דף מנהל,
          פותחת את ה-isLibrarian={true}, מציגה את ה-Toolbar ומאפשרת גרירה ושמירה בבטחה.
        */}
        <RoomMap />
      </div>
    </PageShell>
  );
}
