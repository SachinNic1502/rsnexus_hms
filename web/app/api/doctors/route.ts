import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashSync } from "bcryptjs"
import { z } from "zod"
import { requireRole } from "@/lib/api-utils"

const ADMIN_ROLES = ["super_admin", "hospital_admin"]

const createDoctorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  departmentId: z.string().min(1, "Department is required"),
  specialization: z.string().min(1, "Specialization is required"),
  qualification: z.string().optional().or(z.literal("")),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get("departmentId")

    const where: Record<string, string> = {}
    if (departmentId) where.departmentId = departmentId

    const doctors = await prisma.doctor.findMany({
      where,
      include: { user: true, department: true },
      orderBy: { user: { name: "asc" } },
    })

    return NextResponse.json(doctors)
  } catch {
    return NextResponse.json({ error: "Failed to fetch doctors" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireRole(request, ADMIN_ROLES)
    if (error) return error

    const body = await request.json()
    const parsed = createDoctorSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 })
    }

    const { name, email, password, departmentId, specialization, qualification } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }

    const department = await prisma.department.findUnique({ where: { id: departmentId } })
    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash: hashSync(password, 10),
          role: "doctor",
          isActive: true,
        },
      })

      const doctor = await tx.doctor.create({
        data: {
          userId: user.id,
          departmentId,
          specialization,
          qualification: qualification || "",
          available: true,
        },
        include: { user: true, department: true },
      })

      return doctor
    })

    return NextResponse.json(result, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create doctor" }, { status: 500 })
  }
}
