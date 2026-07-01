import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getToken } from "next-auth/jwt"

const billingRoles = ["super_admin", "hospital_admin", "billing_staff"]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: true,
        items: true,
        payments: true,
        admission: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token || !billingRoles.includes(token.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: body.status,
        discount: body.discount,
        tax: body.tax,
      },
      include: {
        patient: true,
        items: true,
        payments: true,
      },
    })

    return NextResponse.json(invoice)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 })
  }
}
