/*
=========================================================
LoginForm.jsx

תיאור הקובץ:
טופס התחברות למשתמש קיים.

הקובץ אחראי על:
- קליטת אימייל וסיסמה.
- שליחת בקשת התחברות ל-Backend.
- שמירת המשתמש ב-AuthContext.
- מעבר לדף הבית לאחר התחברות מוצלחת.
=========================================================
*/

import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import InputField from "../common/InputField";
import Button from "../common/Button";
import BackButton from "../common/BackButton";
import { AuthContext } from "../../context/AuthContext";
import { loginUser } from "../../services/authService";
import AlertMessage from "../common/AlertMessage";
import { isValidEmail } from "../../utils/validators";

/*
---------------------------------------------------------
LoginForm

תפקיד:
מציגה את טופס ההתחברות ומנהלת את שליחתו לשרת.
---------------------------------------------------------
*/
export default function LoginForm() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
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
  שולחת את פרטי ההתחברות לשרת ושומרת את המשתמש
  ב-AuthContext לאחר התחברות מוצלחת.
  ---------------------------------------------------------
  */
  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;

    setErrorMessage("");

    if (!formData.email.trim() || !formData.password) {
      setErrorMessage("Email and password are required");
      return;
    }

    if (!isValidEmail(formData.email)) {
      setErrorMessage("Invalid email or password");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await loginUser({
        email: formData.email.trim(),
        password: formData.password,
      });

      login(response.data.user);
      // מתן זמן קצרצר ל-Context להתעדכן לפני הניווט
      setTimeout(() => {
        if (response.data.user.role === "librarian") {
          navigate("/admin/librarian");
        } else {
          navigate("/");
        }
      }, 0);
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
        <h1>Welcome Back</h1>
        <p>Login to the Library System</p>

        <div className="stackCol">
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
            autoComplete="current-password"
            required
          />

          <p className="authSwitchText">
            <Link to="/forgot-password" className="authSwitchLink">
              Forgot Password?
            </Link>
          </p>

          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>

          <AlertMessage type="error" message={errorMessage} />
        </div>

        <p className="authSwitchText">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="authSwitchLink">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
}
