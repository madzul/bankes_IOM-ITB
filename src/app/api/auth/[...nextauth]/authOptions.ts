import NextAuth, { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const mappingFakultasProdi : { [key: string]: { fakultas: string; prodi: string } } = {
    "197": { fakultas: "Sekolah Bisnis dan Manajemen", prodi: "TPB SBM" },
  };

function getFakultasProdi(email: string) {
  const prefix = email.substring(0, 3);
  const mapping = mappingFakultasProdi[prefix];
  return mapping || { fakultas: "Unknown Faculty", prodi: "Unknown Program" };
}

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
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "Enter your email" },
        password: { label: "Password", type: "password", placeholder: "Enter your password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }
        // Find the user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) {
          throw new Error("User not found");
        }
        if (!user.password) {
          throw new Error("No password found");
        }
        // Verify the password
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          throw new Error("Incorrect password");
        }
        // Return the user object (this will be stored in the session)
        return {
          id: user.id.toString(),
          role: user.role,
          email: user.email, // Include email for consistency
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }: { account: any; profile?: any }) {
      if (profile?.email?.endsWith("@mahasiswa.itb.ac.id")) {
        const isUserExists = await prisma.user.findFirst({
          where: {
            email: profile.email,
          },
        });
        if (!isUserExists) {
          const newUser = await prisma.user.create({
            data: {
              name: profile.name,
              email: profile.email,
              password: null,
              role: "Mahasiswa",
            },
          });
          const { fakultas, prodi } = getFakultasProdi(newUser.email);
          await prisma.student.create({
            data: {
              nim: newUser.email.substring(0, 8),
              fakultas: fakultas,
              prodi: prodi,
              user_id: newUser.id, // Link the Student to the User
            },
          });
        }
        return true;
      }
      if (account?.provider === "credentials") {
        return true;
      }
      return false;
    },
    async jwt({ token, account, profile }: { token: any; account?: any; profile?: any }) {
      if (profile) {
        const user = await prisma.user.findFirst({
          where: { email: profile.email },
          select: { id: true, role: true },
        });
    
        if (user) {
          token.id = user.id;
          token.role = user.role;
        }
      }
    
      if (!profile && token.email) {
        const user = await prisma.user.findFirst({
          where: { email: token.email },
          select: { id: true, role: true },
        });
    
        if (user) {
          token.id = user.id;
          token.role = user.role;
        }
      }
    
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};