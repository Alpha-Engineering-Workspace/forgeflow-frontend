import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginWithGateway } from "./features/auth/server/login-gateway.js";
import { createServerSession, hasServerSession, revokeServerSession, LOGIN_SESSION_SECONDS } from "./features/auth/server/session-store.js";

class InvalidCredentials extends CredentialsSignin {
  code = "invalid_credentials";
}
class UnverifiedEmail extends CredentialsSignin {
  code = "email_not_verified";
}
class TooManyAttempts extends CredentialsSignin {
  code = "too_many_attempts";
}
class LoginUnavailable extends CredentialsSignin {
  code = "login_unavailable";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: LOGIN_SESSION_SECONDS },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Auth.js can include callback/CSRF fields in its submitted form body.
        // Only the actual credentials cross our strict server-side validation boundary.
        const result = await loginWithGateway({
          email: credentials?.email,
          password: credentials?.password,
        });
        if (result.kind === "invalid") throw new InvalidCredentials();
        if (result.kind === "unverified") throw new UnverifiedEmail();
        if (result.kind === "limited") throw new TooManyAttempts();
        if (result.kind !== "success") throw new LoginUnavailable();

        try {
          const sessionId = await createServerSession(result);
          return { ...result.user, ffSessionId: sessionId };
        } catch {
          // Fail closed if Redis cannot safely persist the backend tokens.
          throw new LoginUnavailable();
        }
      },
    }),
  ],
  events: {
    async signOut({ token }) {
      if (!token?.ffSessionId) return;
      try {
        const result = await revokeServerSession(token.ffSessionId);
        if (result.kind === "unavailable") {
          // Local session is already removed; backend revocation needs retry
          // infrastructure before production. Never log tokens or session IDs.
          console.error("ForgeFlow backend logout revocation unavailable");
        }
      } catch {
        // Do not keep a browser cookie active solely because Redis is down.
        // This is a security-relevant operational failure; don't log secrets.
        console.error("ForgeFlow server logout cleanup failed");
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.ffSessionId = user.ffSessionId;
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      // Removing the Redis record invalidates the otherwise-valid Auth.js cookie.
      if (!token.ffSessionId || !(await hasServerSession(token.ffSessionId))) return null;
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.sub,
        name: token.name,
        email: token.email,
      };
      // Never copy the Redis session ID or backend tokens into the client session.
      return session;
    },
  },
});
