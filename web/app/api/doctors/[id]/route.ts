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
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: { user: true, department: true },
    })

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 })
    }

    return NextResponse.json(doctor)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch doctor" }, { status: 500 })
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

    // Only assign the fields that were actually provided so an edit form that
    // omits (e.g.) departmentId doesn't wipe it. `available` is a boolean so it
    // is checked explicitly for `undefined` rather than truthiness.
    const data: {
      available?: boolean
      specialization?: string
      qualification?: string
      departmentId?: string
    } = {}
    if (typeof body.available === "boolean") data.available = body.available
    if (typeof body.specialization === "string") data.specialization = body.specialization
    if (typeof body.qualification === "string") data.qualification = body.qualification
    if (typeof body.departmentId === "string" && body.departmentId) data.departmentId = body.departmentId

    const doctor = await prisma.doctor.update({
      where: { id },
      data,
      include: { user: true, department: true },
    })

    return NextResponse.json(doctor)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update doctor" }, { status: 500 })
  }
}
