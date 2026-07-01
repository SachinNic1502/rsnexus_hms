import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        department: true,
        consultation: true,
      },
    })

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    return NextResponse.json(appointment)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch appointment" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: body.status,
        date: body.date ? new Date(body.date) : undefined,
        time: body.time,
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        department: true,
      },
    })

    return NextResponse.json(appointment)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 })
  }
}
