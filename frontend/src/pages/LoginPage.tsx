import type { Location } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { LoginForm } from "../features/auth/LoginForm";
import { LogoIcon } from "../components/icons";

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
      {/* The nav (with its logo) is hidden until you're signed in, so the mark
          is repeated here — otherwise the first screen carries no identity. */}
      <div className="login-brand">
        <span className="app-logo">
          <LogoIcon size={24} />
        </span>
        Trade Blotter
      </div>
      <LoginForm onSuccess={handleSuccess} />
    </main>
  );
}
