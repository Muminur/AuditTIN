import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { auth, signOut } from "@/lib/auth";
import { recentAudit } from "@/lib/audit-log";
import { AdminConsole } from "@/components/admin/admin-console";

export const metadata: Metadata = {
  title: "Official console",
  robots: { index: false, follow: false },
};

// Reads the session cookie — must render per-request, never prerendered.
export const dynamic = "force-dynamic";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const email = session?.user?.email;
  const loginPath = locale === "en" ? "/admin/login" : `/${locale}/admin/login`;
  if (!email) redirect(loginPath);

  const initialLog = await recentAudit(20);

  async function doSignOut(): Promise<void> {
    "use server";
    await signOut({ redirectTo: loginPath });
  }

  return (
    <AdminConsole
      email={email}
      initialLog={initialLog}
      signOutAction={doSignOut}
    />
  );
}
