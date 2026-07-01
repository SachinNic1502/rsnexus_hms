import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get("departmentId")

    const where: any = {}
    if (departmentId) where.departmentId = departmentId

    const doctors = await prisma.doctor.findMany({
      where,
      include: { user: true, department: true },
      orderBy: { user: { name: "asc" } },
    })

    return NextResponse.json(doctors)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch doctors" }, { status: 500 })
  }
}
