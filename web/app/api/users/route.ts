import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashSync } from "bcryptjs"
import { z } from "zod"

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["super_admin", "hospital_admin", "receptionist", "doctor", "nurse", "lab_technician", "pharmacist", "billing_staff"]),
  isActive: z.boolean().optional().default(true),
})

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error("GET users error:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createUserSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 })
    }

    const { name, email, password, role, isActive } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 400 })

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashSync(password, 10),
        role,
        isActive,
      },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    })
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("POST user error:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
