/*
  LoginPage.jsx
  -------------
  דף התחברות למערכת.

  אחריות:
  - הצגת טופס התחברות
*/

import PageShell from "../components/layout/PageShell";
import LoginForm from "../components/forms/LoginForm";

export default function LoginPage() {
  return (
    <PageShell>
      <LoginForm />
    </PageShell>
  );
}
