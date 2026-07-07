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
    console.error("GET lab order details error:", error)
    return NextResponse.json({ error: "Failed to fetch lab order details" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !["pending", "in_progress", "completed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
    }

    const updateData: any = { status }
    if (status === "completed") {
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
  } catch (error) {
    console.error("PUT lab order status error:", error)
    return NextResponse.json({ error: "Failed to update lab order status" }, { status: 500 })
  }
}
