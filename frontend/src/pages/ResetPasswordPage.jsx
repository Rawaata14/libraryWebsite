/*
=========================================================
ResetPasswordPage.jsx
=========================================================
*/

import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import PageShell from "../components/layout/PageShell";
import InputField from "../components/common/InputField";
import Button from "../components/common/Button";
import AlertMessage from "../components/common/AlertMessage";
import axios from "axios";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;

    setError("");
    setSuccess("");

    if (!token) {
      setError("Invalid password reset link.");
      return;
    }

    if (formData.password.length < 6 || formData.password.length > 20) {
      setError("Password must be between 6 and 20 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/user/reset-password`,
        {
          token,
          newPassword: formData.password,
        },
      );

      setSuccess("Your password has been reset successfully.");

      setFormData({
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Could not reset password. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell>
      <div className="authPage">
        <form className="authCard" onSubmit={handleSubmit}>
          <h1>Reset Password</h1>

          <p>Enter your new password below.</p>

          {!token ? (
            <AlertMessage
              type="error"
              message="This password reset link is invalid."
            />
          ) : (
            <div className="stackCol">
              <InputField
                label="New Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter new password"
                autoComplete="new-password"
                required
              />

              <InputField
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                autoComplete="new-password"
                required
              />

              <AlertMessage type="error" message={error} />
              <AlertMessage type="success" message={success} />

              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || Boolean(success)}
              >
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          )}

          <p className="authSwitchText">
            <Link to="/login" className="authSwitchLink">
              Back to Login
            </Link>
          </p>
        </form>
      </div>
    </PageShell>
  );
}
