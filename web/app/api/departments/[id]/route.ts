import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-utils"

const ADMIN_ROLES = ["super_admin", "hospital_admin"]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const department = await prisma.department.findUnique({
      where: { id },
      include: { doctors: { include: { user: true } } },
    })

    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 })
    }

    return NextResponse.json(department)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch department" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireRole(request, ADMIN_ROLES)
    if (error) return error

    const { id } = await params
    const body = await request.json()

    const department = await prisma.department.update({
      where: { id },
      data: { name: body.name, description: body.description },
    })

    return NextResponse.json(department)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update department" }, { status: 500 })
  }
}
