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
import axios from "axios";

import InputField from "../common/InputField";
import Button from "../common/Button";
import BackButton from "../common/BackButton";
import { AuthContext } from "../../context/AuthContext";
import { buildApiUrl } from "../../config/api";

const PASSWORD_PATTERN = /^(?=.*[a-zA-Z])(?=.*\d).{6,20}$/;

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
    phone: "",
    address: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (!PASSWORD_PATTERN.test(formData.password)) {
      alert(
        "Password must be 6-20 characters long and include at least one letter and one number.",
      );

      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(
        buildApiUrl("/user/register"),
        {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          phone: formData.phone.trim(),
          address: formData.address.trim(),
        },
        {
          withCredentials: true,
        },
      );

      register(response.data.user);
      navigate("/");
    } catch (error) {
      const message =
        error.response?.data?.message || "Could not connect to the server";

      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="authPage">
      <BackButton />

      <form className="authCard" onSubmit={handleSubmit}>
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

          <InputField
            label="Phone Number"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter your phone number"
            autoComplete="tel"
          />

          <InputField
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter your address"
            autoComplete="street-address"
          />

          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Signing up..." : "Sign Up"}
          </Button>
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
