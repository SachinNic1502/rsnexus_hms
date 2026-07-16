import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-utils"
import { handleApiError } from "@/lib/error-handler"

// Returns the currently logged-in user's own record. Used to self-scope
// the nurse "Available/Unavailable" toggle (mirrors /api/doctors/me).
export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request)
    if (error) return error

    const record = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, role: true, available: true },
    })

    if (!record) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(record)
  } catch (error) {
    return handleApiError(error, "GET users/me")
  }
}

// Lets a user (e.g. a nurse) toggle their own availability. Scoped by the
// session's userId (never a client-supplied id), so a user can only ever
// update their own record.
export async function PATCH(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request)
    if (error) return error

    const body = await request.json()
    if (typeof body.available !== "boolean") {
      return NextResponse.json({ error: "available must be a boolean" }, { status: 400 })
    }

    const record = await prisma.user.update({
      where: { id: user.id },
      data: { available: body.available },
      select: { id: true, name: true, email: true, role: true, available: true },
    })

    return NextResponse.json(record)
  } catch (error) {
    return handleApiError(error, "PATCH users/me")
  }
}
