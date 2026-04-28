/*
  LoginForm.jsx
  -------------
  טופס התחברות למערכת.

  אחריות:
  - קליטת פרטי משתמש קיים
  - שימוש ב-AuthContext לצורך התחברות
  - ניתוב לדף הבית לאחר התחברות מוצלחת
*/

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import InputField from "../common/InputField";
import Button from "../common/Button";
import useAuth from "../../hooks/useAuth";

export default function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // הדמיית משתמש מחובר.
    // בהמשך יוחלף בקריאת API אמיתית לשרת.
    const fakeUser = {
      fullName: "Tom Smith",
      email: formData.email,
      role: "user",
    };

    login(fakeUser);
    navigate("/");
  };

  return (
    <div className="authPage">
      <button type="button" className="backButton" onClick={() => navigate(-1)}>
        ←
      </button>

      <form className="authCard" onSubmit={handleSubmit}>
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
            required
          />

          <InputField
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />

          <Button type="submit" variant="primary">
            Login
          </Button>
        </div>

        <p className="authSwitchText">
          Don't have an account?{" "}
          <Link to="/register" className="authSwitchLink">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
}
