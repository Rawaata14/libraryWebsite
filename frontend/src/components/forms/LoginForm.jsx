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
import axios from "axios";

export default function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:8000/user/login",
        formData,
        { withCredentials: true },
      );
      if (response.data.success) {
        const { fullName, email, role } = response.data.user;
        const connectedUser = {
          fullName,
          email,
          role,
        };
        login(connectedUser);
        navigate("/");
      } else {
        alert(response.data.message || "Login failed");
      }
    } catch (error) {
      const message = error.response?.data?.message || "An error occurred";
      alert(message);
    } finally {
      setIsLoading(false); // מסיימים טעינה בכל מקרה (הצלחה או כישלון)
    }
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
            {isLoading ? "Signing in..." : "Sign In"}
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
