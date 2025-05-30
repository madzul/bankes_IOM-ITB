import { NextAuthOptions, Account, Profile } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";

const prisma = new PrismaClient();

const mappingFakultasProdi : { [key: string]: { fakultas: string; prodi: string } } = {
  "101": { fakultas: "Fakultas Matematika dan Ilmu Pengetahuan Alam", prodi: "Matematika" },
  "102": { fakultas: "Fakultas Matematika dan Ilmu Pengetahuan Alam", prodi: "Fisika" },
  "103": { fakultas: "Fakultas Matematika dan Ilmu Pengetahuan Alam", prodi: "Astronomi" },
  "105": { fakultas: "Fakultas Matematika dan Ilmu Pengetahuan Alam", prodi: "Kimia" },
  "108": { fakultas: "Fakultas Matematika dan Ilmu Pengetahuan Alam", prodi: "Aktuaria" },
  "160": { fakultas: "Fakultas Matematika dan Ilmu Pengetahuan Alam", prodi: "TPB FMIPA" },

  "104": { fakultas: "Sekolah Ilmu dan Teknologi Hayati", prodi: "Mikrobiologi" },
  "106": { fakultas: "Sekolah Ilmu dan Teknologi Hayati", prodi: "Biologi" },
  "112": { fakultas: "Sekolah Ilmu dan Teknologi Hayati", prodi: "Rekayasa Hayati" },
  "114": { fakultas: "Sekolah Ilmu dan Teknologi Hayati", prodi: "Rekayasa Pertanian" },
  "115": { fakultas: "Sekolah Ilmu dan Teknologi Hayati", prodi: "Rekayasa Kehutanan" },
  "119": { fakultas: "Sekolah Ilmu dan Teknologi Hayati", prodi: "Teknologi Pasca Panen" },
  "161": { fakultas: "Sekolah Ilmu dan Teknologi Hayati", prodi: "TPB SITH-S" },
  "198": { fakultas: "Sekolah Ilmu dan Teknologi Hayati", prodi: "TPB SITH-R" },

  "107": { fakultas: "Sekolah Farmasi", prodi: "Sains dan Teknologi Farmasi" },
  "116": { fakultas: "Sekolah Farmasi", prodi: "Farmasi Klinik dan Komunitas" },
  "162": { fakultas: "Sekolah Farmasi", prodi: "TPB SF" },

  "121": { fakultas: "Fakultas Teknik Pertambangan dan Perminyakan", prodi: "Teknik Pertambangan" },
  "122": { fakultas: "Fakultas Teknik Pertambangan dan Perminyakan", prodi: "Teknik Perminyakan" },
  "123": { fakultas: "Fakultas Teknik Pertambangan dan Perminyakan", prodi: "Teknik Geofisika" },
  "125": { fakultas: "Fakultas Teknik Pertambangan dan Perminyakan", prodi: "Teknik Metalurgi" },
  "164": { fakultas: "Fakultas Teknik Pertambangan dan Perminyakan", prodi: "TPB FTTM" },

  "120": { fakultas: "Fakultas Ilmu dan Teknologi Kebumian", prodi: "Teknik Geologi" },
  "128": { fakultas: "Fakultas Ilmu dan Teknologi Kebumian", prodi: "Meteorologi" },
  "129": { fakultas: "Fakultas Ilmu dan Teknologi Kebumian", prodi: "Oseanografi" },
  "151": { fakultas: "Fakultas Ilmu dan Teknologi Kebumian", prodi: "Teknik Geodesi dan Geomatika" },
  "163": { fakultas: "Fakultas Ilmu dan Teknologi Kebumian", prodi: "TPB FITB" },

  "130": { fakultas: "Fakultas Teknologi Industri", prodi: "Teknik Kimia" },
  "133": { fakultas: "Fakultas Teknologi Industri", prodi: "Teknik Fisika" },
  "134": { fakultas: "Fakultas Teknologi Industri", prodi: "Teknik Industri" },
  "143": { fakultas: "Fakultas Teknologi Industri", prodi: "Teknik Pangan" },
  "144": { fakultas: "Fakultas Teknologi Industri", prodi: "Manajemen Rekayasa" },
  "145": { fakultas: "Fakultas Teknologi Industri", prodi: "Teknik Bioenergi dan Kemurgi" },
  "167": { fakultas: "Fakultas Teknologi Industri", prodi: "TPB FTI" },

  "132": { fakultas: "Sekolah Teknik Elektro dan Informatika", prodi: "Teknik Elektro" },
  "135": { fakultas: "Sekolah Teknik Elektro dan Informatika", prodi: "Teknik Informatika" },
  "165": { fakultas: "Sekolah Teknik Elektro dan Informatika", prodi: "TPB STEI-R" },
  "180": { fakultas: "Sekolah Teknik Elektro dan Informatika", prodi: "Teknik Tenaga Listrik" },
  "181": { fakultas: "Sekolah Teknik Elektro dan Informatika", prodi: "Teknik Telekomunikasi" },
  "182": { fakultas: "Sekolah Teknik Elektro dan Informatika", prodi: "Sistem dan Teknologi Informasi" },
  "183": { fakultas: "Sekolah Teknik Elektro dan Informatika", prodi: "Teknik Biomedis" },
  "196": { fakultas: "Sekolah Teknik Elektro dan Informatika", prodi: "TPB STEI-K" },

  "131": { fakultas: "Fakultas Teknik Mesin dan Dirgantara", prodi: "Teknik Mesin" },
  "136": { fakultas: "Fakultas Teknik Mesin dan Dirgantara", prodi: "Teknik Dirgantara" },
  "137": { fakultas: "Fakultas Teknik Mesin dan Dirgantara", prodi: "Teknik Material" },
  "169": { fakultas: "Fakultas Teknik Mesin dan Dirgantara", prodi: "TPB FTMD" },

  "150": { fakultas: "Fakultas Teknik Sipil dan Lingkungan", prodi: "Teknik Sipil" },
  "153": { fakultas: "Fakultas Teknik Sipil dan Lingkungan", prodi: "Teknik Lingkungan" },
  "155": { fakultas: "Fakultas Teknik Sipil dan Lingkungan", prodi: "Teknik Kelautan" },
  "157": { fakultas: "Fakultas Teknik Sipil dan Lingkungan", prodi: "Rekayasa Infrastruktur Lingkungan" },
  "158": { fakultas: "Fakultas Teknik Sipil dan Lingkungan", prodi: "Teknik dan Pengelolaan Sumber Daya Air" },
  "166": { fakultas: "Fakultas Teknik Sipil dan Lingkungan", prodi: "TPB FTSL" },

  "152": { fakultas: "Sekolah Arsitektur, Perencanaan dan Pengembangan Kebijakan", prodi: "Arsitektur" },
  "154": { fakultas: "Sekolah Arsitektur, Perencanaan dan Pengembangan Kebijakan", prodi: "Perencanaan Wilayah dan Kota" },
  "156": { fakultas: "Sekolah Arsitektur, Perencanaan dan Pengembangan Kebijakan", prodi: "Perencanaan Wilayah dan Kota (Kampus Cirebon)" },
  "199": { fakultas: "Sekolah Arsitektur, Perencanaan dan Pengembangan Kebijakan", prodi: "TPB SAPPK" },

  "168": { fakultas: "Fakultas Seni Rupa dan Desain", prodi: "TPB FSRD" },
  "170": { fakultas: "Fakultas Seni Rupa dan Desain", prodi: "Seni Rupa" },
  "171": { fakultas: "Fakultas Seni Rupa dan Desain", prodi: "Kriya (Kampus Cirebon)" },
  "172": { fakultas: "Fakultas Seni Rupa dan Desain", prodi: "Kriya" },
  "173": { fakultas: "Fakultas Seni Rupa dan Desain", prodi: "Desain Interior" },
  "174": { fakultas: "Fakultas Seni Rupa dan Desain", prodi: "Desain Komunikasi Visual" },
  "175": { fakultas: "Fakultas Seni Rupa dan Desain", prodi: "Desain Produk" },

  "190": { fakultas: "Sekolah Bisnis dan Manajemen", prodi: "Manajemen" },
  "192": { fakultas: "Sekolah Bisnis dan Manajemen", prodi: "Kewirausahaan" },
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
          id: user.user_id.toString(),
          role: user.role,
          email: user.email, // Include email for consistency
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }: { account: Account | null; profile?: Profile }) {
      if (profile?.email?.endsWith("@mahasiswa.itb.ac.id")) {
        const isUserExists = await prisma.user.findFirst({
          where: {
            email: profile.email,
          },
        });
        if (!isUserExists && profile.name) {
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
              faculty: fakultas,
              major: prodi,
              student_id: newUser.user_id, // Link the Student to the User
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
    async jwt({ token, profile }: { token: JWT; profile?: Profile }) {
      if (profile) {
        const user = await prisma.user.findFirst({
          where: { email: profile.email },
          select: { user_id: true, role: true },
        });
    
        if (user && user.user_id != null) {
          token.id = user.user_id.toString();
          token.role = user.role;
        }
      }
    
      if (!profile && token.email) {
        const user = await prisma.user.findFirst({
          where: { email: token.email },
          select: { user_id: true, role: true },
        });
    
        if (user) {
          token.id = user.user_id.toString();
          token.role = user.role;
        }
      }
    
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
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