import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./AuthContext";
import { getAuthToken } from "../../api/auth-token";

const { loginMock } = vi.hoisted(() => ({ loginMock: vi.fn() }));

vi.mock("./auth-api", () => ({
  authApi: { login: loginMock },
}));

function TestConsumer() {
  const { user, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="username">{user?.username ?? "none"}</span>
      <button onClick={() => login("trader1", "pw")}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    loginMock.mockReset();
    localStorage.clear();
  });

  it("starts with no user when nothing is stored", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("username")).toHaveTextContent("none");
    expect(getAuthToken()).toBeUndefined();
  });

  it("restores a user from localStorage on mount", () => {
    localStorage.setItem(
      "auth",
      JSON.stringify({ token: "stored-token", user: { id: "USR-2", username: "trader2" } }),
    );

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("username")).toHaveTextContent("trader2");
    expect(getAuthToken()).toBe("stored-token");
  });

  it("logs in, persists to storage, and pushes the token into the shared accessor", async () => {
    loginMock.mockResolvedValue({ token: "abc123", user: { id: "USR-1", username: "trader1" } });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await userEvent.click(screen.getByText("login"));

    await waitFor(() => expect(screen.getByTestId("username")).toHaveTextContent("trader1"));
    expect(getAuthToken()).toBe("abc123");
    expect(JSON.parse(localStorage.getItem("auth")!)).toEqual({
      token: "abc123",
      user: { id: "USR-1", username: "trader1" },
    });
  });

  it("logs out, clears storage, and clears the shared token", async () => {
    loginMock.mockResolvedValue({ token: "abc123", user: { id: "USR-1", username: "trader1" } });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await userEvent.click(screen.getByText("login"));
    await waitFor(() => expect(screen.getByTestId("username")).toHaveTextContent("trader1"));

    await userEvent.click(screen.getByText("logout"));

    expect(screen.getByTestId("username")).toHaveTextContent("none");
    expect(getAuthToken()).toBeUndefined();
    expect(localStorage.getItem("auth")).toBeNull();
  });
});
