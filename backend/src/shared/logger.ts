type LogFields = Record<string, unknown>;

function line(level: string, message: string, fields?: LogFields): string {
  const suffix = fields ? ` ${JSON.stringify(fields)}` : "";
  return `[${new Date().toISOString()}] ${level.toUpperCase()} ${message}${suffix}`;
}

export const logger = {
  info(message: string, fields?: LogFields) {
    console.log(line("info", message, fields));
  },
  warn(message: string, fields?: LogFields) {
    console.warn(line("warn", message, fields));
  },
  error(message: string, fields?: LogFields) {
    console.error(line("error", message, fields));
  },
};
