import { httpClient } from "./http-client";
import type { Position } from "../types/position";

export const positionsApi = {
  list: () => httpClient.get<Position[]>("/positions"),
};
