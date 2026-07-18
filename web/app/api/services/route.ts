import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getToken } from "next-auth/jwt"

const serviceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  price: z.number().min(0, "Price must be positive"),
  description: z.string().optional().or(z.literal("")),
})

export async function GET(request: NextRequest) {
  try {
    // The billing line-item picker wants only active services, but the services
    // catalog needs to see inactive ones too so an admin can re-activate them
    // (an inactive service would otherwise vanish from every screen forever).
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get("includeInactive") === "true"
    const services = await prisma.service.findMany({
      where: {
        OR: [{ isDeleted: { isSet: false } }, { isDeleted: false }],
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(services)
  } catch (error) {
    console.error("GET services error:", error)
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token || !["super_admin", "hospital_admin"].includes(token.role as string)) {
      return NextResponse.json({ error: "Only admins can create services" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = serviceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 })
    }

    const { description, ...required } = parsed.data
    const service = await prisma.service.create({
      data: {
        ...required,
        description: description || null,
      },
    })
    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error("POST service error:", error)
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 })
  }
}
