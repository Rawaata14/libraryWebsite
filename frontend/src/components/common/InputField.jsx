/*
=========================================================
InputField.jsx

תיאור הקובץ:
קומפוננטת שדה קלט משותפת לטפסים במערכת.

הקומפוננטה אחראית על:
- הצגת תווית ושדה קלט בעיצוב אחיד.
- חיבור נגיש בין התווית לשדה.
- העברת מאפייני HTML נוספים לשדה הקלט.
- צמצום כפילות בין טופסי המערכת.
=========================================================
*/

import PropTypes from "prop-types";

/*
---------------------------------------------------------
InputField

תפקיד:
מציגה שדה קלט כללי שניתן להתאים לסוגי טפסים שונים.

restInputProps:
מכיל מאפייני HTML נוספים כמו:
- autoComplete
- minLength
- maxLength
- disabled
- inputMode
---------------------------------------------------------
*/
export default function InputField({
  label,
  id,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  required = false,
  ...restInputProps
}) {
  const inputId = id || name;

  return (
    <div className="formGroup">
      {label && (
        <label className="label" htmlFor={inputId}>
          {label}
        </label>
      )}

      <input
        {...restInputProps}
        id={inputId}
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

/*
---------------------------------------------------------
InputField.propTypes

תפקיד:
מגדיר אילו Props הקומפוננטה מקבלת ומה הסוג הצפוי
של כל אחד מהם בזמן הפיתוח.
---------------------------------------------------------
*/
InputField.propTypes = {
  label: PropTypes.string,
  id: PropTypes.string,
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]).isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
};
