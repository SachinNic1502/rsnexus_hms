import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getAuthUser } from "@/lib/api-utils"
import { createAuditLog } from "@/lib/audit"

const stockSchema = z.object({
  stock: z.number().int().min(0),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = stockSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid stock value" }, { status: 400 })
    }

    const current = await prisma.medicine.findUnique({
      where: { id },
      select: { name: true, stock: true },
    })

    const medicine = await prisma.medicine.update({
      where: { id },
      data: { stock: parsed.data.stock },
    })

    const authUser = await getAuthUser(request)
    if (authUser && current) {
      await createAuditLog({
        userId: authUser.id,
        action: "STOCK_UPDATE",
        details: `Updated stock of ${current.name} from ${current.stock} to ${parsed.data.stock}`,
      })
    }

    return NextResponse.json(medicine)
  } catch (error) {
    console.error("PUT stock update error:", error)
    return NextResponse.json({ error: "Failed to update stock" }, { status: 500 })
  }
}
