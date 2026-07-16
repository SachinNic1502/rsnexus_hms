import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
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

    const target = await prisma.user.findUnique({ where: { id } })
    if (!target || target.isDeleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { password, ...data } = parsed.data

    // Prevent orphaning: role can't be switched into or out of "doctor" here,
    // because that would desync the linked Doctor record. Use the Doctors flow.
    if (data.role !== undefined && data.role !== target.role && (data.role === "doctor" || target.role === "doctor")) {
      return NextResponse.json(
        { error: "Doctor role changes must be done via Settings → Doctors to keep the doctor profile in sync" },
        { status: 400 }
      )
    }

    const session = await getServerSession(authOptions)
    const isSelf = session?.user?.id === id
    const wouldDeactivate = data.isActive === false
    const wouldDemote = data.role !== undefined && data.role !== target.role

    // Don't let an admin lock themselves out (deactivate or demote own account).
    if (isSelf && (wouldDeactivate || wouldDemote)) {
      return NextResponse.json({ error: "You cannot deactivate or change the role of your own account" }, { status: 400 })
    }

    // Don't let the last active super_admin be deactivated or demoted away.
    if (target.role === "super_admin" && (wouldDeactivate || (wouldDemote && data.role !== "super_admin"))) {
      const activeSuperAdmins = await prisma.user.count({
        where: { role: "super_admin", isActive: true, isDeleted: { isSet: false } },
      })
      if (activeSuperAdmins <= 1) {
        return NextResponse.json({ error: "Cannot deactivate or demote the last super admin" }, { status: 400 })
      }
    }

    // Guard email uniqueness explicitly so a collision returns 400, not 500.
    if (data.email && data.email !== target.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } })
      if (existing) {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 })
      }
    }

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
    const session = await getServerSession(authOptions)
    if (session?.user?.id === id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 })
    }
    await prisma.user.update({
      where: { id },
      // Also deactivate so the soft-deleted account can no longer authenticate
      // (login checks isActive; isDeleted alone would still allow sign-in).
      data: { isActive: false, isDeleted: true, deletedAt: new Date(), deletedBy: session?.user?.id },
    })
    return NextResponse.json({ message: "User deleted" })
  } catch (error) {
    console.error("DELETE user error:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
