import { httpClient } from "../../api/http-client";

export interface LoginResult {
  token: string;
  user: { id: string; username: string };
}

export const authApi = {
  login: (username: string, password: string) => httpClient.post<LoginResult>("/auth/login", { username, password }),
};
