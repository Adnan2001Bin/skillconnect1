import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      _id?: string;
      isVerified?: boolean;
      userName?: string;
    } & DefaultSession["user"];
    accessToken?: string;
  }

  interface User {
    _id?: string;
    isVerified?: boolean;
    userName?: string;
  }

  interface JWT {
    _id?: string;
    isVerified?: boolean;
    userName?: string;
    accessToken?: string;
  }
}