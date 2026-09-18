import { NavLink } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

function navLinkClassName({ isActive }: { isActive: boolean }): string {
  return isActive ? "app-nav-link active" : "app-nav-link";
}

export function AppNav() {
  const { user, logout } = useAuth();

  return (
    <nav className="app-nav" aria-label="Primary">
      <NavLink to="/" end className={navLinkClassName}>
        Blotter
      </NavLink>
      <NavLink to="/symbols" className={navLinkClassName}>
        By Symbol
      </NavLink>
      <NavLink to="/positions" className={navLinkClassName}>
        Positions
      </NavLink>
      <div className="app-nav-spacer" />
      {user && (
        <div className="app-nav-user">
          <span className="app-nav-username">{user.username}</span>
          <button type="button" className="btn-ghost" onClick={logout}>
            Log out
          </button>
        </div>
      )}
    </nav>
  );
}
