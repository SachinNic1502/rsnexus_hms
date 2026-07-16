import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-utils"
import { handleApiError } from "@/lib/error-handler"

// Returns the Doctor record for the currently logged-in user. Used to scope
// the Doctor Appointment / OPD queue views to the doctor's own patients.
// The route file `me` takes precedence over the sibling `[id]` dynamic route,
// so `/api/doctors/me` never collides with `/api/doctors/<id>`.
export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request)
    if (error) return error

    const doctor = await prisma.doctor.findUnique({
      where: { userId: user.id },
      include: { user: true, department: true },
    })

    if (!doctor) {
      return NextResponse.json({ error: "No doctor profile for this user" }, { status: 404 })
    }

    return NextResponse.json(doctor)
  } catch (error) {
    return handleApiError(error, "GET doctors/me")
  }
}

// Lets a doctor toggle their own availability. Scoped by the session's
// userId (never a client-supplied doctor id), so a doctor can only ever
// update their own record.
export async function PATCH(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request)
    if (error) return error

    const body = await request.json()
    if (typeof body.available !== "boolean") {
      return NextResponse.json({ error: "available must be a boolean" }, { status: 400 })
    }

    const doctor = await prisma.doctor.update({
      where: { userId: user.id },
      data: { available: body.available },
      include: { user: true, department: true },
    })

    return NextResponse.json(doctor)
  } catch (error) {
    return handleApiError(error, "PATCH doctors/me")
  }
}
