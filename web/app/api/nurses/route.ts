import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashSync } from "bcryptjs"
import { z } from "zod"

const createNurseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  staffType: z.enum(["Nurse", "Compounder"]),
})

const nurseSelect = {
  id: true,
  name: true,
  email: true,
  staffType: true,
  isActive: true,
  createdAt: true,
}

export async function GET() {
  try {
    const nurses = await prisma.user.findMany({
      where: { role: "nurse" },
      select: nurseSelect,
      orderBy: { name: "asc" },
    })

    return NextResponse.json(nurses)
  } catch {
    return NextResponse.json({ error: "Failed to fetch nurses" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createNurseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 })
    }

    const { name, email, password, staffType } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }

    const nurse = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashSync(password, 10),
        role: "nurse",
        staffType,
        isActive: true,
      },
      select: nurseSelect,
    })

    return NextResponse.json(nurse, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create nurse" }, { status: 500 })
  }
}
