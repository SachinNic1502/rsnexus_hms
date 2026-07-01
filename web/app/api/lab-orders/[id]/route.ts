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
        patient: true,
        doctor: { include: { user: true } },
        tests: true,
        report: true,
      },
    })

    if (!labOrder) {
      return NextResponse.json({ error: "Lab order not found" }, { status: 404 })
    }

    return NextResponse.json(labOrder)
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
          patient: true,
          doctor: { include: { user: true } },
          tests: true,
          report: true,
        },
      })

      return NextResponse.json(labOrder)
    }

    return NextResponse.json({ error: "Invalid update" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update lab order" }, { status: 500 })
  }
}
