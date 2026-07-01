import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { results, uploadedBy } = body

    const report = await prisma.labReport.create({
      data: {
        labOrderId: id,
        results,
        uploadedBy: uploadedBy || "System",
      },
    })

    await prisma.labOrder.update({
      where: { id },
      data: { status: "completed", completedAt: new Date() },
    })

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to upload report" }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const report = await prisma.labReport.findUnique({
      where: { labOrderId: id },
      include: { labOrder: { include: { patient: true, tests: true } } },
    })

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    return NextResponse.json(report)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 })
  }
}
