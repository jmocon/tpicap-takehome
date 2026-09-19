import { NavLink } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { LogoIcon, LogoutIcon, UserIcon } from "./icons";

function navLinkClassName({ isActive }: { isActive: boolean }): string {
  return isActive ? "app-nav-link active" : "app-nav-link";
}

export function AppNav() {
  const { user, logout } = useAuth();

  return (
    // The bar itself is full-bleed (so the rule under it spans the viewport);
    // `.app-nav-inner` is what lines its contents up with the page below.
    <nav className="app-nav" aria-label="Primary">
      <div className="app-nav-inner">
        <span className="app-logo" aria-hidden="true">
          <LogoIcon size={22} />
        </span>
        <div className="app-nav-links">
          <NavLink to="/" end className={navLinkClassName}>
            Blotter
          </NavLink>
          <NavLink to="/symbols" className={navLinkClassName}>
            By Symbol
          </NavLink>
          <NavLink to="/positions" className={navLinkClassName}>
            Positions
          </NavLink>
        </div>
        <div className="app-nav-spacer" />
        {user && (
          <div className="app-nav-user">
            <span className="app-nav-username">
              <UserIcon />
              {user.username}
            </span>
            <button type="button" className="btn-ghost btn-icon" onClick={logout}>
              <LogoutIcon />
              Log out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
