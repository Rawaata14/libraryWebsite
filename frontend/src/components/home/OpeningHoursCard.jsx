/*
  OpeningHoursCard.jsx
  --------------------
  כרטיסיית שעות פתיחה.
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
