import { Route, Routes } from "react-router-dom";
import { AppNav } from "./components/AppNav";
import { TradeBlotterPage } from "./pages/TradeBlotterPage";
import { SymbolPage } from "./pages/SymbolPage";
import { PositionsPage } from "./pages/PositionsPage";
import { LoginPage } from "./pages/LoginPage";
import { RequireAuth } from "./features/auth/RequireAuth";
import { useAuth } from "./features/auth/AuthContext";

export function App() {
  const { user } = useAuth();

  return (
    <>
      {/* Hidden entirely on the login screen — there's nothing to navigate to until you're signed in. */}
      {user && <AppNav />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <TradeBlotterPage />
            </RequireAuth>
          }
        />
        <Route
          path="/symbols/:symbol?"
          element={
            <RequireAuth>
              <SymbolPage />
            </RequireAuth>
          }
        />
        <Route
          path="/positions"
          element={
            <RequireAuth>
              <PositionsPage />
            </RequireAuth>
          }
        />
      </Routes>
    </>
  );
}
