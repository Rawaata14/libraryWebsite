/*
  OpeningHoursCard.jsx
  --------------------
  כרטיס המציג את שעות הפעילות של הספרייה.

  אחריות:
  - להציג למשתמש את שעות הפעילות בצורה ברורה
*/

export default function OpeningHoursCard() {
  return (
    <div className="sectionCard">
      <div className="sectionCardHeader">Opening Hours</div>

      <div className="sectionCardBody infoCardBody">
        <p>Sunday - Thursday: 08:00 - 20:00</p>
        <p>Friday: 08:00 - 13:00</p>
        <p>Saturday: Closed</p>
      </div>
    </div>
  );
}
