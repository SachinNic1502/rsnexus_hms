import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const labOrderSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  consultationId: z.string().optional().or(z.literal("")),
  doctorId: z.string().min(1, "Doctor is required"),
  testIds: z.array(z.string()).min(1, "At least one test required"),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const patientId = searchParams.get("patientId")

    const where: any = {}
    if (status && status !== "all") where.status = status
    if (patientId) where.patientId = patientId

    // Patient is resolved separately — some lab orders point at a patientId
    // whose Patient no longer exists, and Prisma's include throws "Field
    // patient is required ... got null" the moment one of those is touched.
    const rawLabOrders = await prisma.labOrder.findMany({
      where,
      include: {
        doctor: { include: { user: true } },
        tests: true,
        report: true,
      },
      orderBy: { orderedAt: "desc" },
    })

    const patientIds = [...new Set(rawLabOrders.map((l) => l.patientId))]
    const patients = await prisma.patient.findMany({ where: { id: { in: patientIds } } })
    const patientById = new Map(patients.map((p) => [p.id, p]))

    const labOrders = rawLabOrders
      .filter((l) => patientById.has(l.patientId))
      .map((l) => ({ ...l, patient: patientById.get(l.patientId)! }))

    return NextResponse.json(labOrders)
  } catch (error) {
    console.error("GET lab orders error:", error)
    return NextResponse.json({ error: "Failed to fetch lab orders" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = labOrderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 })
    }

    const { patientId, consultationId, doctorId, testIds } = parsed.data

    const lastOrder = await prisma.labOrder.findFirst({
      orderBy: { orderedAt: "desc" },
      select: { orderNumber: true },
    })

    let nextNumber = 1
    if (lastOrder) {
      const match = lastOrder.orderNumber.match(/(\d+)$/)
      if (match) nextNumber = parseInt(match[1]) + 1
    }
    const orderNumber = `LAB-${new Date().getFullYear()}-${String(nextNumber).padStart(3, "0")}`

    const tests = await prisma.labTest.findMany({
      where: { id: { in: testIds } },
    })

    const labOrder = await prisma.labOrder.create({
      data: {
        patientId,
        consultationId: consultationId || null,
        doctorId,
        orderNumber,
        tests: {
          create: tests.map((t) => ({
            labTestId: t.id,
            testName: t.name,
            price: t.price,
          })),
        },
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        tests: true,
      },
    })

    return NextResponse.json(labOrder, { status: 201 })
  } catch (error) {
    console.error("POST lab order error:", error)
    return NextResponse.json({ error: "Failed to create lab order" }, { status: 500 })
  }
}
