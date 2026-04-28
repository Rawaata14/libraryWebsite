/*
  EventsPage.jsx
  --------------
  דף האירועים של הספרייה.

  אחריות:
  - להציג אירועים קרובים
  - לארגן את האירועים בצורה ברורה ונוחה למשתמש
  - לשמש בסיס לדף אירועים דינמי בעתיד

  הערה:
  כרגע המידע סטטי. בהמשך ניתן לחבר את הדף ל־API.
*/

import PageShell from "../components/layout/PageShell";
import PageBanner from "../components/layout/PageBanner";
import Button from "../components/common/Button";

const events = [
  {
    id: 1,
    title: "Creative Writing Workshop",
    date: "May 18, 2026",
    time: "10:00 - 12:00",
    location: "Main Hall",
    description:
      "A guided workshop for students interested in creative writing, storytelling, and idea development.",
    image:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 2,
    title: "Annual Book Fair",
    date: "May 27 - May 29, 2026",
    time: "09:00 - 18:00",
    location: "Library Courtyard",
    description:
      "A three-day event featuring books, publishers, discounts, and reading activities for students.",
    image:
      "https://images.unsplash.com/photo-1524578271613-d550eacf6090?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 3,
    title: "Guest Lecture: Research Skills",
    date: "June 8, 2026",
    time: "14:00 - 15:30",
    location: "Conference Room",
    description:
      "An academic session focused on improving research techniques, source evaluation, and information literacy.",
    image:
      "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function EventsPage() {
  return (
    <PageShell userType="guest">
      <PageBanner title="Events" />

      <div className="eventsPageContainer">
        <div className="eventsPageCard">
          <div className="eventsIntro">
            <h2>Upcoming Library Events</h2>
            <p>
              Explore workshops, lectures, and special library activities
              designed to enrich learning and student engagement.
            </p>
          </div>

          <div className="eventsGrid">
            {events.map((eventItem) => (
              <article key={eventItem.id} className="eventCard">
                <div className="eventCardImage">
                  <img src={eventItem.image} alt={eventItem.title} />
                </div>

                <div className="eventCardBody">
                  <h3>{eventItem.title}</h3>

                  <p className="eventMeta">
                    <strong>Date:</strong> {eventItem.date}
                  </p>

                  <p className="eventMeta">
                    <strong>Time:</strong> {eventItem.time}
                  </p>

                  <p className="eventMeta">
                    <strong>Location:</strong> {eventItem.location}
                  </p>

                  <p className="eventDescription">{eventItem.description}</p>

                  <Button variant="primary">Learn More</Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
