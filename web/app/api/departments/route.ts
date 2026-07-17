import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { requireRole } from "@/lib/api-utils"

const ADMIN_ROLES = ["super_admin", "hospital_admin"]

const departmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().or(z.literal("")),
})

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: { select: { doctors: true } },
      },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(departments)
  } catch (error) {
    console.error("GET departments error:", error)
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireRole(request, ADMIN_ROLES)
    if (error) return error

    const body = await request.json()
    const parsed = departmentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 })
    }

    const { description, ...required } = parsed.data
    const department = await prisma.department.create({
      data: { ...required, description: description || null },
    })
    return NextResponse.json(department, { status: 201 })
  } catch (error) {
    console.error("POST department error:", error)
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 })
  }
}
