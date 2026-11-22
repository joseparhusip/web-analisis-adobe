export const SESSION_COOKIE = "session";

export function accessPassword(): string | undefined {
  const password = process.env.ACCESS_PASSWORD?.trim();
  return password ? password : undefined;
}

export function isGateEnabled(): boolean {
  return accessPassword() !== undefined;
}

export async function sessionToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`stock-research:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function expectedToken(): Promise<string | undefined> {
  const password = accessPassword();
  return password ? sessionToken(password) : undefined;
}

export function verifyPassword(input: string): boolean {
  const password = accessPassword();
  return password !== undefined && input === password;
}
