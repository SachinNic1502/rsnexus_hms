import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const labTestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  price: z.number().min(0, "Price must be positive"),
  description: z.string().optional().or(z.literal("")),
})

export async function GET() {
  try {
    const labTests = await prisma.labTest.findMany({
      where: { isDeleted: false },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(labTests)
  } catch (error) {
    console.error("GET lab tests error:", error)
    return NextResponse.json({ error: "Failed to fetch lab tests" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = labTestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 })
    }

    const { description, ...required } = parsed.data
    const labTest = await prisma.labTest.create({
      data: { ...required, description: description || null },
    })
    return NextResponse.json(labTest, { status: 201 })
  } catch (error) {
    console.error("POST lab test error:", error)
    return NextResponse.json({ error: "Failed to create lab test" }, { status: 500 })
  }
}
