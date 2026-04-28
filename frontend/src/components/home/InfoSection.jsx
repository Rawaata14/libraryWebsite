/*
  InfoSection.jsx
  ---------------
  אזור מידע כללי בדף הבית.

  אחריות:
  - להציג כרטיסי מידע חשובים למשתמש
  - לשלב שעות פעילות ואירועים
*/

import OpeningHoursCard from "./OpeningHoursCard";
import EventsCard from "./EventsCard";

export default function InfoSection() {
  return (
    <section className="homeInfoGrid">
      <OpeningHoursCard />
      <EventsCard />
    </section>
  );
}
