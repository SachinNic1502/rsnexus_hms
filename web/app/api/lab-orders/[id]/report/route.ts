import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: labOrderId } = await params
    const body = await request.json()
    const { results, uploadedBy } = body

    if (!results) {
      return NextResponse.json({ error: "Results are required" }, { status: 400 })
    }

    const labOrder = await prisma.labOrder.findUnique({
      where: { id: labOrderId },
    })

    if (!labOrder) {
      return NextResponse.json({ error: "Lab order not found" }, { status: 404 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // Upsert report
      const report = await tx.labReport.upsert({
        where: { labOrderId },
        create: {
          labOrderId,
          results,
          uploadedBy: uploadedBy || "Lab Technician",
        },
        update: {
          results,
          uploadedBy: uploadedBy || "Lab Technician",
          isDeleted: false,
        },
      })

      // Update lab order status to completed
      await tx.labOrder.update({
        where: { id: labOrderId },
        data: {
          status: "completed",
          completedAt: new Date(),
        },
      })

      return report
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("POST lab report error:", error)
    return NextResponse.json({ error: "Failed to save lab report" }, { status: 500 })
  }
}
