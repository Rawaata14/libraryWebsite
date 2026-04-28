/*
  InputField.jsx
  --------------
  קומפוננטת שדה קלט כללית לשימוש חוזר בטפסים.

  אחריות:
  - להציג תווית ושדה קלט בעיצוב אחיד
  - לצמצם כפילות קוד בטפסים
  - לאפשר שימוש פשוט בטפסי התחברות, הרשמה ופרופיל
*/

export default function InputField({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <div className="formGroup">
      {label && <label className="label">{label}</label>}

      <input
        className="input"
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}
