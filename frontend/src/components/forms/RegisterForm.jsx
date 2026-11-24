/*
=========================================================
RegisterForm.jsx

תיאור הקובץ:
טופס הרשמה למשתמש חדש.

הקובץ אחראי על:
- קליטת פרטי המשתמש.
- בדיקה בסיסית של הסיסמה.
- שליחת בקשת הרשמה ל-Backend.
- שמירת המשתמש ב-AuthContext.
- מעבר לדף הבית לאחר הרשמה מוצלחת.
=========================================================
*/

import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import InputField from "../common/InputField";
import Button from "../common/Button";
import BackButton from "../common/BackButton";
import { AuthContext } from "../../context/AuthContext";
import { registerUser } from "../../services/authService";
import { isValidEmail, isValidPassword } from "../../utils/validators";
import AlertMessage from "../common/AlertMessage";

/*
---------------------------------------------------------
RegisterForm

תפקיד:
מציגה את טופס ההרשמה ומנהלת יצירת חשבון חדש.
---------------------------------------------------------
*/
export default function RegisterForm() {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /*
  ---------------------------------------------------------
  handleChange

  תפקיד:
  מעדכנת את שדה הטופס שהמשתמש שינה.
  ---------------------------------------------------------
  */
  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  }

  /*
  ---------------------------------------------------------
  handleSubmit

  תפקיד:
  מאמתת את הסיסמה, שולחת את נתוני ההרשמה,
  ושומרת את המשתמש המחובר ב-AuthContext.
  ---------------------------------------------------------
  */
  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;

    setErrorMessage("");

    if (!formData.fullName.trim()) {
      setErrorMessage("Full name is required");
      return;
    }

    if (!isValidEmail(formData.email)) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    if (!isValidPassword(formData.password)) {
      setErrorMessage(
        "Password must be 6-20 characters long and include at least one letter and one number.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await registerUser({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      register(response.data.user);
      navigate("/");
    } catch (error) {
      const message =
        error.response?.data?.message || "Could not connect to the server";

      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="authPage">
      <BackButton />

      <form className="authCard" onSubmit={handleSubmit} noValidate>
        <h1>Join the Library</h1>
        <p>Create a new account to access the library system.</p>

        <div className="stackCol">
          <InputField
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Enter your full name"
            autoComplete="name"
            required
          />

          <InputField
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            autoComplete="email"
            required
          />

          <InputField
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            autoComplete="new-password"
            required
          />

          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Signing up..." : "Sign Up"}
          </Button>
          <AlertMessage type="error" message={errorMessage} />
        </div>

        <p className="authSwitchText">
          Already have an account?{" "}
          <Link to="/login" className="authSwitchLink">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
