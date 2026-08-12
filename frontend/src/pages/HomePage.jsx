/*
=========================================================
HomePage.jsx

תיאור הקובץ:
דף הבית הראשי של מערכת הספרייה.

הדף משלב:
- אזור פתיחה.
- מידע כללי ושעות פעילות.
- אזור מפת מקומות הלימוד.
- ספרים מומלצים.
=========================================================
*/

import PageShell from "../components/layout/PageShell";
import HeroSection from "../components/home/HeroSection";
import RoomMapSection from "../components/home/RoomMapSection";
import InfoSection from "../components/home/InfoSection";
import RecommendedBooks from "../components/home/RecommendedBooks";

/*
---------------------------------------------------------
HomePage

תפקיד:
מרכיבה את אזורי התוכן המרכזיים של דף הבית.
---------------------------------------------------------
*/
export default function HomePage() {
  return (
    <PageShell>
      <div className="homeContainer">
        <div className="homeCard">
          <HeroSection />

          {/* שעות עבודה ואירועים */}
          <InfoSection />

          {/* מפת מקומות הלימוד */}
          <RoomMapSection />

          {/* ספרים מומלצים */}
          <RecommendedBooks />
        </div>
      </div>
    </PageShell>
  );
}
