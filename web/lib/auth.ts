import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[AUTH] Login attempt:", credentials?.email)

        if (!credentials?.email || !credentials?.password) {
          console.log("[AUTH] Missing email or password")
          throw new Error("Invalid credentials")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          console.log("[AUTH] User not found:", credentials.email)
          throw new Error("Invalid credentials")
        }

        if (!user.isActive) {
          console.log("[AUTH] User is inactive:", credentials.email)
          throw new Error("Invalid credentials")
        }

        const isPasswordValid = await compare(credentials.password, user.passwordHash)

        if (!isPasswordValid) {
          console.log("[AUTH] Invalid password for:", credentials.email)
          throw new Error("Invalid credentials")
        }

        console.log("[AUTH] Login successful:", user.email, "role:", user.role)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).role = token.role
        ;(session.user as any).id = token.id
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
