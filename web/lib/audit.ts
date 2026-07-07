import { prisma } from "@/lib/prisma"

interface AuditLogParams {
  userId: string
  action: string
  details: string
}

export async function createAuditLog({ userId, action, details }: AuditLogParams) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, role: true },
    })

    if (!user) {
      console.warn(`AuditLog: User not found for ID: ${userId}`)
      return
    }

    return await prisma.auditLog.create({
      data: {
        userId,
        userName: user.name,
        userRole: user.role,
        action,
        details,
      },
    })
  } catch (error) {
    console.error("Failed to write audit log:", error)
  }
}
