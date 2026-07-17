import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-utils"

const ADMIN_ROLES = ["super_admin", "hospital_admin"]

const nurseSelect = {
  id: true,
  name: true,
  email: true,
  staffType: true,
  isActive: true,
  createdAt: true,
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const nurse = await prisma.user.findUnique({
      where: { id },
      select: nurseSelect,
    })

    if (!nurse) {
      return NextResponse.json({ error: "Nurse not found" }, { status: 404 })
    }

    return NextResponse.json(nurse)
  } catch {
    return NextResponse.json({ error: "Failed to fetch nurse" }, { status: 500 })
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

    const nurse = await prisma.user.update({
      where: { id },
      data: {
        isActive: body.isActive,
        staffType: body.staffType,
      },
      select: nurseSelect,
    })

    return NextResponse.json(nurse)
  } catch {
    return NextResponse.json({ error: "Failed to update nurse" }, { status: 500 })
  }
}
