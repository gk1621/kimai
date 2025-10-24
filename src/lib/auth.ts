import NextAuth, { type NextAuthOptions, getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { pool } from "@/lib/db";
import { compare } from "bcryptjs";

export type AppUser = {
  user_id: string;
  firm_id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "ATTORNEY" | "INTAKE" | "PARALEGAL" | "VIEWER";
};

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const conn = await pool.getConnection();
        try {
          const [rows] = await conn.query(
            "SELECT user_id, firm_id, email, name, role, password_hash FROM users WHERE email=? LIMIT 1",
            [credentials.email]
          );
          const row: any = Array.isArray(rows) ? rows[0] : null;
          if (!row) return null;
          const ok = row.password_hash ? await compare(credentials.password, row.password_hash) : false;
          if (!ok) return null;
          return {
            id: row.user_id,
            user_id: row.user_id,
            firm_id: row.firm_id,
            email: row.email,
            name: row.name,
            role: row.role,
          } as any;
        } finally {
          conn.release();
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user_id = (user as any).user_id;
        token.firm_id = (user as any).firm_id;
        token.role = (user as any).role;
      }
      return token as any;
    },
    async session({ session, token }) {
      (session as any).user.user_id = (token as any).user_id;
      (session as any).user.firm_id = (token as any).firm_id;
      (session as any).user.role = (token as any).role;
      return session;
    },
  },
};

// next-auth v4 compatibility for App Router
const handler = NextAuth(authOptions);
export const handlers = { GET: handler, POST: handler } as const;
export const auth = () => getServerSession(authOptions);



