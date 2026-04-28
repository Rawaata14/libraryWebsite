/*
  RegisterForm.jsx
  ----------------
  טופס הרשמה למשתמש חדש.

  אחריות:
  - קליטת פרטי משתמש חדש
  - שימוש ב-AuthContext לצורך יצירת משתמש מחובר
  - ניתוב לדף הבית לאחר הרשמה מוצלחת
*/

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import InputField from "../common/InputField";
import Button from "../common/Button";
import useAuth from "../../hooks/useAuth";

export default function RegisterForm() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
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

    // הדמיית הרשמה.
    // בהמשך יוחלף בקריאת API אמיתית לשרת.
    const newUser = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      role: "user",
    };

    register(newUser);
    navigate("/");
  };

  return (
    <div className="authPage">
      <button type="button" className="backButton" onClick={() => navigate(-1)}>
        ←
      </button>

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
            required
          />

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

          <InputField
            label="Phone Number"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter your phone number"
          />

          <InputField
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter your address"
          />

          <Button type="submit" variant="primary">
            Sign Up
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
