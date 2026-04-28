/*
  Button.jsx
  ----------
  קומפוננטת כפתור כללית לשימוש חוזר בכל המערכת.

  אחריות:
  - להציג כפתור בעיצוב אחיד
  - לאפשר שימוש בגרסאות שונות של כפתורים
*/

export default function Button({
  children,
  variant = "primary",
  type = "button",
  onClick,
}) {
  return (
    <button type={type} className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
}
