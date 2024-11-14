import NextAuth, { User } from "next-auth";
import { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

const providers: Array<Provider> = [GitHub, Google];

if (process.env.NODE_ENV === "development") {
  // This is used only for development, especially automated test which needs auth
  providers.push(
    Credentials({
      id: "password",
      name: "Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: (credentials) => {
        if (credentials.password === "developer-password") {
          return {
            email: credentials.email,
            name: "Developer",
            image: "https://avatars.githubusercontent.com/u/67470890?s=200&v=4",
          } as User;
        }
        return null;
      },
    }),
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
});
