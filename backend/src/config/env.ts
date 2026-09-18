export interface Env {
  port: number;
  databaseFile: string;
  corsOrigin: string;
  jwtSecret: string;
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return {
    port: Number(source.PORT ?? 4000),
    databaseFile: source.DATABASE_FILE ?? "./data/trades.db",
    corsOrigin: source.CORS_ORIGIN ?? "http://localhost:5173",
    // Dev-only fallback so the app still boots without a .env — never rely on
    // this default outside local development; set a real JWT_SECRET in prod.
    jwtSecret: source.JWT_SECRET ?? "dev-only-insecure-secret-change-me",
  };
}
