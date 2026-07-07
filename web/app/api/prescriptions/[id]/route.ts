import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        consultation: true,
        medicines: true,
      },
    })

    if (!prescription) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 })
    }

    return NextResponse.json(prescription)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch prescription" }, { status: 500 })
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

    const prescription = await prisma.prescription.update({
      where: { id },
      data: { status },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        consultation: true,
        medicines: true,
      },
    })

    return NextResponse.json(prescription)
  } catch (error) {
    console.error("PUT prescription error:", error)
    return NextResponse.json({ error: "Failed to update prescription" }, { status: 500 })
  }
}
