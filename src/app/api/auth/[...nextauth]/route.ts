import NextAuth, { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: "openid profile email",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }: { account: any; profile?: any }) {
      if (profile?.email?.endsWith("@mahasiswa.itb.ac.id")) {
        // check the email is already registered or not 
        const isUserExists = await prisma.user.findFirst({
          where: {
            email: profile.email
          }
        })

        if(!isUserExists){
          await prisma.user.create({
            data:{
              name: profile.name, 
              email: profile.email, 
              password: null,
              role: "Mahasiswa"
            }
          });
        }

        return true;
      }
      return false;
    },

    async jwt({ token, account, profile }: { token: any; account?: any; profile?: any }) {
      if (profile) {
        // Fetch the user from the database using their email
        const user = await prisma.user.findFirst({
          where: { email: profile.email },
          select: { id: true }, // Only select the `id` field
        });
    
        if (user) {
          token.id = user.id; // Store the `id` in the token
        }
      }
      return token;
    },

    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id as string; // Pass the `id` from the token to the session
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
