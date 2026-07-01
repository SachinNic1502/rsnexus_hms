import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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
    const { id } = await params
    const body = await request.json()

    const doctor = await prisma.doctor.update({
      where: { id },
      data: {
        available: body.available,
        specialization: body.specialization,
      },
      include: { user: true, department: true },
    })

    return NextResponse.json(doctor)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update doctor" }, { status: 500 })
  }
}
