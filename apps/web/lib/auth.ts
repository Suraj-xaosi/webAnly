// src/lib/authOptions.ts
import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import  prisma from "@repo/db"
export const authOptions: NextAuthOptions = {
  adapter:PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      
      name: "Credentials",
      
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          // if no user or no password (oauth-only user) => deny
          if (!user || !user.password) return null;

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isValid) return null;

          // Return minimal user object that NextAuth will store in token
          return {
            id: user.id,
            name: user.name ?? undefined,
            email: user.email,
          } as any;
        } catch (err) {
          // log server-side error, but do not return error message to client
          console.error("Authorize error:", err);
          return null;
        }
      },
    }),
    

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],

  // Use JWT strategy (stateless)
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 day
    // updateAge controls how often an existing session JWT is updated.
    // 3600 = update once per hour (recommended instead of 0)
    updateAge: 60 * 60,
  },

  callbacks: {
    // persist user.id into the JWT when they sign in
    async jwt({ token, user, account }) {
      // On first sign in, `user` will be available
      if (user && (user as any).id) {
        token.id = (user as any).id;
      }

      // Optionally: copy other fields
      if (!token.name && (user as any).name) token.name = (user as any).name;
      return token;
    },

    // Make `session.user.id` available in the client session object
    async session({ session, token }) {
      if (session?.user && token?.id) {
        (session.user as any).id = token.id as string;
      }
      return session;
    },

    // On OAuth sign in, ensure user exists in DB (upsert)
    async signIn({ user, account }) {
      console.log("OAuth user:", user);
      console.log("OAuth account:", account);

      try {
        // Only handle OAuth providers (Google, Github etc)
        if (account?.provider && account.type === "oauth") {
        const email = user.email;
        if (!email) return false; // Provider MUST return email

        // 1️⃣ Upsert the user (no password)
        const dbUser = await prisma.user.upsert({
          where: { email },
          update: { name: user.name ?? undefined },
          create: {
            email,
            name: user.name ?? undefined,
          },
        });

      // 2️⃣ Upsert the account record
        await prisma.account.upsert({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          update: {
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at ?? null,
            token_type: account.token_type ?? null,
            scope: account.scope ?? null,
            id_token: account.id_token ?? null,
          },
          create: {
            userId: dbUser.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at ?? null,
            token_type: account.token_type ?? null,
            scope: account.scope ?? null,
            id_token: account.id_token ?? null,
          },
        });

        console.log("OAuth user + account stored correctly");
      }

      return true;
    } catch (err) {
      console.error("signIn callback error:", err);
      return false;
    }

    }

  },

  pages: {
    signIn: "/login",
  },

  // NextAuth needs a secret for JWT signing in production
  secret: process.env.NEXTAUTH_SECRET,
};
