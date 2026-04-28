/*
  HeroSection.jsx
  ---------------
  אזור הפתיחה של דף הבית.

  אחריות:
  - להציג כותרת מרכזית והסבר קצר על המערכת
  - לשמור על אזור פתיחה נקי וברור
*/

export default function HeroSection() {
  return (
    <section className="heroWrap">
      <div className="heroPanel">
        <div className="heroContent">
          <h1>Welcome to the Library</h1>
          <p>Your place for knowledge, study, and community.</p>
          <p>
            Explore available seats, reserve books, and manage your time more
            efficiently.
          </p>
        </div>
      </div>
    </section>
  );
}
