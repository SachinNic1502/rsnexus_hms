import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          include: { doctor: { include: { user: true } }, department: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        consultations: {
          include: { doctor: { include: { user: true } }, prescription: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        admissions: {
          include: { ward: true, room: true, bed: true, doctor: { include: { user: true } } },
          orderBy: { admissionDate: "desc" },
          take: 5,
        },
        labOrders: {
          include: { tests: true, doctor: { include: { user: true } }, report: true },
          orderBy: { orderedAt: "desc" },
          take: 10,
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    return NextResponse.json(patient)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch patient" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        name: body.name,
        mobile: body.mobile,
        gender: body.gender,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        age: body.age ? parseInt(body.age) : undefined,
        address: body.address,
        bloodGroup: body.bloodGroup || undefined,
        emergencyContact: body.emergencyContact || undefined,
        emergencyContactNumber: body.emergencyContactNumber || undefined,
      },
    })

    return NextResponse.json(patient)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update patient" }, { status: 500 })
  }
}
