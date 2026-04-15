import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    backendToken: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    backendToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    backendToken: string;
    userId: string;
  }
}
