import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireRole(request, ["super_admin", "hospital_admin"])
    if (error) return error

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    const search = searchParams.get("search")

    const where: any = {}
    if (action && action !== "all") where.action = action
    if (search) {
      where.OR = [
        { userName: { contains: search, mode: "insensitive" } },
        { details: { contains: search, mode: "insensitive" } },
      ]
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error("GET audit logs error:", error)
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
  }
}
