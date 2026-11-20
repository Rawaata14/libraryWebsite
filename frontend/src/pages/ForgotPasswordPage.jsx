import { useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../components/layout/PageShell";
import InputField from "../components/common/InputField";
import Button from "../components/common/Button";
import axios from "axios";

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
    setIsSubmitting(true);

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/user/forgot-password`,
        {
          email: email.trim(),
        },
      );

      setMessage(
        "If an account exists with this email, a password reset link will be sent.",
      );
    } catch (err) {
      setError(
        "Unable to process your request right now. Please try again later.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell>
      <div className="authPage">
        <form className="authCard" onSubmit={handleSubmit}>
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
            {message && <p role="status">{message}</p>}
            {error && <p role="alert">{error}</p>}

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
