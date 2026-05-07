const SESSION_KEY = "dineflow.sessionId";
const TABLE_KEY = "dineflow.tableCode";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = uuid();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function resetSessionId(): string {
  const id = uuid();
  localStorage.setItem(SESSION_KEY, id);
  return id;
}

export function getTableCode(): string | null {
  return localStorage.getItem(TABLE_KEY);
}

export function setTableCode(code: string): void {
  localStorage.setItem(TABLE_KEY, code.toUpperCase());
}

export function clearTableCode(): void {
  localStorage.removeItem(TABLE_KEY);
}
