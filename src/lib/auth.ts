import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

/**
 * Auth.js v5 — email-allowlist + shared-password gate for the official console.
 *
 * This is a deliberately simple demo gate: an email on ADMIN_EMAIL_ALLOWLIST
 * plus the shared ADMIN_PASSWORD. In a real deployment, prefer an OAuth
 * provider (or Vercel Password Protection on /admin). Auth is required for all
 * /api/admin/* routes and every access is logged (CLAUDE.md §3).
 */

const ALLOWLIST = (process.env.ADMIN_EMAIL_ALLOWLIST ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

export function isAllowed(email: string): boolean {
  return ALLOWLIST.includes(email.trim().toLowerCase());
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;
        if (!isAllowed(email)) return null;
        if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) return null;
        return { id: email, email, name: email };
      },
    }),
  ],
  callbacks: {
    // Belt-and-braces: only allowlisted emails get a valid token.
    jwt({ token }) {
      if (token.email && !isAllowed(token.email)) return {};
      return token;
    },
  },
});
