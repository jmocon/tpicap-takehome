export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  error: {
    message: string;
    details?: unknown;
  };
}

export function ok<T>(data: T): ApiSuccess<T> {
  return { data };
}

export function fail(message: string, details?: unknown): ApiError {
  return { error: { message, details } };
}
