"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, sessionToken, verifyPassword } from "@/lib/auth/session";
import { DAY } from "@/lib/time";

export interface LoginState {
  error: string;
}

export async function loginAction(_: LoginState | null, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!verifyPassword(password)) return { error: "Password salah" };

  const jar = await cookies();
  jar.set(SESSION_COOKIE, await sessionToken(password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: (30 * DAY) / 1000,
  });

  redirect(next.startsWith("/") ? next : "/");
}
