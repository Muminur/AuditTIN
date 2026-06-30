import type { Metadata } from "next";
import { AuthError } from "next-auth";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ShieldCheck } from "lucide-react";
import { signIn } from "@/lib/auth";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const adminPath = locale === "en" ? "/admin" : `/${locale}/admin`;

  async function authenticate(
    _prev: string | undefined,
    formData: FormData,
  ): Promise<string | undefined> {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: adminPath,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        const tt = await getTranslations({ locale, namespace: "admin" });
        return tt("loginError");
      }
      throw error; // re-throw redirect/control-flow errors
    }
    return undefined;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="mb-6 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-nbr-green text-paper">
          <ShieldCheck aria-hidden className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold text-paper">
          {t("loginTitle")}
        </h1>
        <p className="mt-2 text-sm text-mute">{t("loginSubtitle")}</p>
      </div>
      <LoginForm action={authenticate} />
    </div>
  );
}
