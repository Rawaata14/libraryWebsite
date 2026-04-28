/*
  HomePage.jsx
  ------------
  דף הבית של המערכת.

  אחריות:
  - להציג את המסך הראשי למשתמש
  - לשלב אזורי תוכן מרכזיים:
    1. אזור פתיחה
    2. מפת מקומות
    3. מידע כללי
    4. ספרים מומלצים
*/

import PageShell from "../components/layout/PageShell";
import HeroSection from "../components/home/HeroSection";
import RoomMapSection from "../components/home/RoomMapSection";
import InfoSection from "../components/home/InfoSection";
import RecommendedBooks from "../components/home/RecommendedBooks";

export default function HomePage() {
  return (
    <PageShell userType="guest">
      <div className="homeContainer">
        <div className="homeCard">
          <HeroSection />
          <RoomMapSection />
          <InfoSection />
          <RecommendedBooks />
        </div>
      </div>
    </PageShell>
  );
}
