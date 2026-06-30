"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { LogIn, Lock } from "lucide-react";

type Action = (
  prev: string | undefined,
  formData: FormData,
) => Promise<string | undefined>;

export function LoginForm({ action }: { action: Action }) {
  const t = useTranslations("admin");
  const [error, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="card space-y-5 p-6 sm:p-8">
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-paper"
        >
          {t("emailLabel")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="w-full rounded-md border border-line bg-ink-2/70 px-3 py-2.5 text-paper outline-none focus:border-jade"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-paper"
        >
          {t("passwordLabel")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-md border border-line bg-ink-2/70 px-3 py-2.5 text-paper outline-none focus:border-jade"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-nbr-green px-5 py-2.5 font-display font-semibold text-paper transition-colors hover:bg-jade hover:text-ink disabled:opacity-50"
      >
        {pending ? (
          <Lock aria-hidden className="h-4 w-4 animate-pulse" />
        ) : (
          <LogIn aria-hidden className="h-4 w-4" />
        )}
        {pending ? t("signingIn") : t("signIn")}
      </button>
    </form>
  );
}
