import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getToken } from "next-auth/jwt"
import { z } from "zod"

const reportResultSchema = z.object({
  testId: z.string().optional().or(z.literal("")),
  testName: z.string().min(1, "Test name is required"),
  result: z.string().min(1, "Result is required"),
  normalRange: z.string().optional().or(z.literal("")),
  isAbnormal: z.boolean().optional(),
})

const reportSchema = z.object({
  results: z.array(reportResultSchema).min(1, "At least one result is required"),
  uploadedBy: z.string().optional().or(z.literal("")),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = reportSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 })
    }

    // Verify the order exists before creating an orphan report, and prevent a
    // duplicate report (labOrderId is unique — a second POST would otherwise 500).
    const order = await prisma.labOrder.findUnique({ where: { id }, include: { report: true } })
    if (!order) {
      return NextResponse.json({ error: "Lab order not found" }, { status: 404 })
    }
    if (order.report) {
      return NextResponse.json({ error: "A report already exists for this lab order" }, { status: 409 })
    }

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    const uploader =
      (parsed.data.uploadedBy && parsed.data.uploadedBy.trim()) ||
      (token?.name as string) ||
      (token?.email as string) ||
      (token?.id as string) ||
      "System"

    const report = await prisma.labReport.create({
      data: {
        labOrderId: id,
        results: parsed.data.results,
        uploadedBy: uploader,
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
