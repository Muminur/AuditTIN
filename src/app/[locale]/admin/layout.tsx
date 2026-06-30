import { setRequestLocale } from "next-intl/server";

/**
 * Admin area wrapper. The auth gate itself lives in `admin/page.tsx` so the
 * sibling `admin/login` route stays reachable without a redirect loop.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <div className="min-h-[60vh]">{children}</div>;
}
