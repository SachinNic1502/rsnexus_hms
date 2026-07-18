import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const labOrder = await prisma.labOrder.findUnique({
      where: { id },
      include: {
        doctor: { include: { user: true } },
        tests: true,
        report: true,
      },
    })

    if (!labOrder) {
      return NextResponse.json({ error: "Lab order not found" }, { status: 404 })
    }

    // Patient is resolved separately — some lab orders point at a patientId
    // whose Patient no longer exists, and Prisma's include throws "Field
    // patient is required ... got null" the moment one of those is touched.
    const patient = await prisma.patient.findUnique({ where: { id: labOrder.patientId } })
    if (!patient) {
      return NextResponse.json({ error: "Lab order not found" }, { status: 404 })
    }

    return NextResponse.json({ ...labOrder, patient })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch lab order" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (body.status) {
      const updateData: any = { status: body.status }
      if (body.status === "completed") {
        updateData.completedAt = new Date()
      }

      const labOrder = await prisma.labOrder.update({
        where: { id },
        data: updateData,
        include: {
          doctor: { include: { user: true } },
          tests: true,
          report: true,
        },
      })

      const patient = await prisma.patient.findUnique({ where: { id: labOrder.patientId } })

      return NextResponse.json({ ...labOrder, patient })
    }

    return NextResponse.json({ error: "Invalid update" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update lab order" }, { status: 500 })
  }
}
