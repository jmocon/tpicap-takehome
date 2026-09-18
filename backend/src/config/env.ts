export interface Env {
  port: number;
  databaseFile: string;
  corsOrigin: string;
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return {
    port: Number(source.PORT ?? 4000),
    databaseFile: source.DATABASE_FILE ?? "./data/trades.db",
    corsOrigin: source.CORS_ORIGIN ?? "http://localhost:5173",
  };
}
