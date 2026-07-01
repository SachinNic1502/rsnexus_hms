import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashSync } from "bcryptjs"
import { z } from "zod"

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional().or(z.literal("")),
  role: z.enum(["super_admin", "hospital_admin", "receptionist", "doctor", "nurse", "lab_technician", "pharmacist", "billing_staff"]).optional(),
  isActive: z.boolean().optional(),
}).refine(obj => Object.keys(obj).length > 0, { message: "No fields to update" })

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = updateUserSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 })
    }

    const { password, ...data } = parsed.data
    
    const updateData: any = { ...data }
    if (password) updateData.passwordHash = hashSync(password, 10)

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    })
    return NextResponse.json(user)
  } catch (error) {
    console.error("PUT user error:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
    if (user.role === "super_admin") return NextResponse.json({ error: "Cannot delete super admin" }, { status: 400 })
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ message: "User deleted" })
  } catch (error) {
    console.error("DELETE user error:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
