import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const medicineUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  genericName: z.string().optional().or(z.literal("")),
  manufacturer: z.string().optional().or(z.literal("")),
  category: z.string().optional().or(z.literal("")),
  stock: z.number().int().min(0).optional(),
  unit: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const medicine = await prisma.medicine.findUnique({ where: { id } })
    if (!medicine) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(medicine)
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = medicineUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 })
    }

    const { genericName, manufacturer, category, ...data } = parsed.data
    
    const updateData: any = { ...data }
    if (genericName !== undefined) updateData.genericName = genericName || null
    if (manufacturer !== undefined) updateData.manufacturer = manufacturer || null
    if (category !== undefined) updateData.category = category || null

    const medicine = await prisma.medicine.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json(medicine)
  } catch (error) {
    console.error("PUT medicine error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.medicine.delete({ where: { id } })
    return NextResponse.json({ message: "Deleted" })
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
