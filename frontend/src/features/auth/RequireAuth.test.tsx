import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./RequireAuth";

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }));

vi.mock("./AuthContext", () => ({
  useAuth: useAuthMock,
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/"
          element={
            <RequireAuth>
              <p>Protected</p>
            </RequireAuth>
          }
        />
        <Route path="/login" element={<p>Login page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RequireAuth", () => {
  it("renders children when a user is present", () => {
    useAuthMock.mockReturnValue({ user: { id: "USR-1", username: "trader1" } });

    renderAt("/");

    expect(screen.getByText("Protected")).toBeInTheDocument();
  });

  it("redirects to /login when no user is present", () => {
    useAuthMock.mockReturnValue({ user: undefined });

    renderAt("/");

    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Protected")).not.toBeInTheDocument();
  });
});
