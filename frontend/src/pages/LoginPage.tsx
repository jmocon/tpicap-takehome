import type { Location } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { LoginForm } from "../features/auth/LoginForm";

interface LocationState {
  from?: Location;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  function handleSuccess() {
    const state = location.state as LocationState | null;
    const redirectTo = state?.from ? `${state.from.pathname}${state.from.search}` : "/";
    navigate(redirectTo, { replace: true });
  }

  return (
    <main className="login-page">
      <LoginForm onSuccess={handleSuccess} />
    </main>
  );
}
