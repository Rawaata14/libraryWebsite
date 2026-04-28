/*
  RegisterPage.jsx
  ----------------
  דף הרשמה למערכת.

  אחריות:
  - הצגת טופס הרשמה
*/

import PageShell from "../components/layout/PageShell";
import RegisterForm from "../components/forms/RegisterForm";

export default function RegisterPage() {
  return (
    <PageShell>
      <RegisterForm />
    </PageShell>
  );
}
