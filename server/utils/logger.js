// Strukturalangan JSON logger. Maxfiy maydonlar loglarga tushmasligi uchun tozalanadi.

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };
const SENSITIVE = /token|secret|password|authorization|initdata|api[-_]?key|hash|cookie|service[-_]?account/i;
const BOT_TOKEN_PATTERN = /\b\d{6,}:[A-Za-z0-9_-]{30,}\b/g;

let threshold = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

export function setLogLevel(level) {
  threshold = LEVELS[level] ?? LEVELS.info;
}

export function redact(value, depth = 0) {
  if (value == null) return value;
  if (typeof value === 'string') return value.replace(BOT_TOKEN_PATTERN, '[REDACTED]');
  if (typeof value !== 'object') return value;
  if (depth > 5) return '[Truncated]';
  if (value instanceof Error) {
    return { name: value.name, message: redact(value.message), code: value.code, stack: redact(value.stack) };
  }
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  const out = {};
  for (const [key, v] of Object.entries(value)) {
    out[key] = SENSITIVE.test(key) ? '[REDACTED]' : redact(v, depth + 1);
  }
  return out;
}

function write(level, message, meta) {
  if (LEVELS[level] < threshold) return;
  const entry = { time: new Date().toISOString(), level, msg: redact(message) };
  if (meta !== undefined) Object.assign(entry, redact(meta));
  const line = JSON.stringify(entry);
  if (level === 'error' || level === 'warn') process.stderr.write(line + '\n');
  else process.stdout.write(line + '\n');
}

export const logger = {
  debug: (msg, meta) => write('debug', msg, meta),
  info: (msg, meta) => write('info', msg, meta),
  warn: (msg, meta) => write('warn', msg, meta),
  error: (msg, meta) => write('error', msg, meta),
};
