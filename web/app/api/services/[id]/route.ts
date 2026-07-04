import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getToken } from "next-auth/jwt"

const serviceUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  description: z.string().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
})

async function requireAdmin(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || !["super_admin", "hospital_admin"].includes(token.role as string)) {
    return NextResponse.json({ error: "Only admins can modify services" }, { status: 403 })
  }
  return null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const service = await prisma.service.findUnique({ where: { id } })
    if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(service)
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin(request)
    if (adminCheck) return adminCheck

    const { id } = await params
    const body = await request.json()
    const parsed = serviceUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 })
    }

    const { description, ...data } = parsed.data
    
    const updateData: Record<string, unknown> = { ...data }
    if (description !== undefined) updateData.description = description || null

    const service = await prisma.service.update({
      where: { id },
      data: updateData,
    })
    return NextResponse.json(service)
  } catch (error) {
    console.error("PUT service error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin(_request)
    if (adminCheck) return adminCheck

    const { id } = await params
    const token = await getToken({ req: _request, secret: process.env.NEXTAUTH_SECRET })
    await prisma.service.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: token?.sub || undefined,
      },
    })
    return NextResponse.json({ message: "Deleted" })
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
