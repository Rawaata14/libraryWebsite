import { useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../components/layout/PageShell";
import InputField from "../components/common/InputField";
import Button from "../components/common/Button";
import AlertMessage from "../components/common/AlertMessage";
import { isValidEmail } from "../utils/validators";
import axios from "axios";
import { buildApiUrl } from "../config/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;

    setMessage("");
    setError("");

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post(
        buildApiUrl("/user/forgot-password"),
        {
          email: email.trim(),
        },
      );

      setMessage(
        "If an account exists with this email, a password reset link will be sent.",
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to process your request right now. Please try again later.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell>
      <div className="authPage">
        <form className="authCard" onSubmit={handleSubmit} noValidate>
          <h1>Forgot Password?</h1>

          <p>Enter your email address to receive a password reset link.</p>

          <div className="stackCol">
            <InputField
              label="Email"
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              required
            />
            <AlertMessage type="success" message={message} />
            <AlertMessage type="error" message={error} />

            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </Button>
          </div>

          <p className="authSwitchText">
            Remember your password?{" "}
            <Link to="/login" className="authSwitchLink">
              Back to Login
            </Link>
          </p>
        </form>
      </div>
    </PageShell>
  );
}
