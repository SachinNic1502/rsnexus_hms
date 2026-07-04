import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const medicineSchema = z.object({
  name: z.string().min(1, "Name is required"),
  genericName: z.string().optional().or(z.literal("")),
  manufacturer: z.string().optional().or(z.literal("")),
  category: z.string().optional().or(z.literal("")),
  stock: z.number().int().min(0).default(0),
  unit: z.string().min(1, "Unit is required"),
  price: z.number().min(0, "Price must be positive"),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""

    const where: any = { isDeleted: false }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { genericName: { contains: search, mode: "insensitive" } },
      ]
    }

    const medicines = await prisma.medicine.findMany({
      where,
      orderBy: { name: "asc" },
      take: search ? 20 : undefined,
    })
    return NextResponse.json(medicines)
  } catch (error) {
    console.error("GET medicines error:", error)
    return NextResponse.json({ error: "Failed to fetch medicines" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = medicineSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 })
    }

    const { genericName, manufacturer, category, ...required } = parsed.data
    const medicine = await prisma.medicine.create({
      data: {
        ...required,
        genericName: genericName || null,
        manufacturer: manufacturer || null,
        category: category || null,
      },
    })
    return NextResponse.json(medicine, { status: 201 })
  } catch (error) {
    console.error("POST medicine error:", error)
    return NextResponse.json({ error: "Failed to create medicine" }, { status: 500 })
  }
}
