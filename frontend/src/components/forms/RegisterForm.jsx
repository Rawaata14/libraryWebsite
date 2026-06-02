/*
  RegisterForm.jsx
  ----------------
  טופס הרשמה למשתמש חדש.

  אחריות:
  - קליטת פרטי משתמש חדש
  - שימוש ב-AuthContext לצורך יצירת משתמש מחובר
  - ניתוב לדף הבית לאחר הרשמה מוצלחת
*/

import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import InputField from "../common/InputField";
import Button from "../common/Button";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";

export default function RegisterForm() {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    passwordHash: "",
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (event) => {
    event.preventDefault();

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{6,20}$/;

    if (!passwordRegex.test(formData.passwordHash)) {
      alert(
        "Password must be 6-20 characters long and include at least one letter and one number.",
      );
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        "http://localhost:8000/user/register",
        formData,
        { withCredentials: true },
      );
      if (response.data.success) {
        const newUser = {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone || null, // Optional field, set to null if not provided
          role: "reader", // ברירת מחדל לתפקיד "קורא"
        };
        //register(newUser);
        navigate("/login");
      } else {
        alert(response.data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Error during registration:", error);
      alert("Server error. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
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
            name="passwordHash"
            value={formData.passwordHash}
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
            {isSubmitting ? "Signing Up..." : "Sign Up"}
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
