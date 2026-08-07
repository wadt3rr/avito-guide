
const PREFIX = 'avito-onboarding:';

interface Progress {
  step: number;
  finished: boolean;
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    return;
  }
}

export function getProgress(scenarioId: string): Progress | null {
  return read<Progress>(`progress:${scenarioId}`);
}

export function saveProgress(scenarioId: string, step: number, finished = false): void {
  write(`progress:${scenarioId}`, { step, finished });
}

export function getAnonId(): string {
  const existing = read<string>('anon');
  if (existing) return existing;

  const id = uuid();
  write('anon', id);
  return id;
}

export function getSessionId(): string {
  const KEY = PREFIX + 'session';
  try {
    const existing = sessionStorage.getItem(KEY);
    if (existing) return existing;

    const id = uuid();
    sessionStorage.setItem(KEY, id);
    return id;
  } catch {
    return uuid();
  }
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
