"use client";

import { Lock, Telescope } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { type LoginState, loginAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}

function LoginForm() {
  const [state, action, pending] = useActionState<LoginState | null, FormData>(loginAction, null);
  const next = useSearchParams().get("next") ?? "/";

  return (
    <form action={action} className="w-full max-w-sm space-y-5 rounded-2xl border bg-card p-6">
      <div className="flex items-center gap-2 font-semibold">
        <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Telescope className="size-4" />
        </span>
        Stock Research
      </div>
      <div>
        <h1 className="text-lg font-semibold">Masuk</h1>
        <p className="mt-1 text-sm text-muted-foreground">Masukkan password akses untuk membuka aplikasi.</p>
      </div>

      <input type="hidden" name="next" value={next} />
      <div className="relative">
        <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="password" type="password" placeholder="Password akses" className="pl-9" autoFocus required />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Memeriksa…" : "Masuk"}
      </Button>
    </form>
  );
}
