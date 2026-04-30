/*
  EventsCard.jsx
  --------------
  כרטיס המציג אירועים קרובים.

  אחריות:
  - להציג למשתמש אירועים רלוונטיים
  - בהמשך יוכל להיטען מהשרת
*/

export default function EventsCard() {
  return (
    <div className="sectionCard">
      <div className="sectionCardHeader">Upcoming Events</div>

      <div className="sectionCardBody infoCardBody">
        <p>May 18 - Writing Workshop</p>
        <p>May 27–29 - Book Fair</p>
        <p>June 8 - Guest Lecture</p>
      </div>
    </div>
  );
}
