/*
  PageBanner.jsx
  --------------
  כותרת עליונה לכל דף.

  אחריות:
  - להציג שם הדף
  - לשמור על מבנה אחיד בין דפים
*/

export default function PageBanner({ title }) {
  return <div className="pageBanner">{title}</div>;
}
