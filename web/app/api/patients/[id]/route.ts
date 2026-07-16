import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { patientSchema } from "@/lib/validations"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const patient = await prisma.patient.findFirst({
      where: { id, isDeleted: { isSet: false } },
      include: {
        appointments: {
          where: { isDeleted: { isSet: false } },
          include: { doctor: { include: { user: true } }, department: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        consultations: {
          include: { doctor: { include: { user: true } }, prescription: { include: { medicines: true } } },
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
          include: { items: true, payments: true },
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

    // Validate the same way create does, so a PUT cannot store an invalid
    // mobile / too-short name that POST would reject.
    const parsed = patientSchema.safeParse(body)
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
      return NextResponse.json({ error: "Validation failed", details: messages }, { status: 400 })
    }

    const existing = await prisma.patient.findFirst({ where: { id, isDeleted: { isSet: false } } })
    if (!existing) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    const d = parsed.data
    // Map cleared optional fields to `null` (not `undefined`) so Prisma unsets
    // them — `undefined` means "leave unchanged", which would silently keep a
    // stale value the user just cleared.
    const patient = await prisma.patient.update({
      where: { id },
      data: {
        name: d.name,
        mobile: d.mobile,
        gender: d.gender,
        dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth) : null,
        age: d.age ? parseInt(d.age) : null,
        address: d.address,
        bloodGroup: d.bloodGroup ? d.bloodGroup : null,
        emergencyContact: d.emergencyContact || null,
        emergencyContactNumber: d.emergencyContactNumber || null,
      },
    })

    return NextResponse.json(patient)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update patient" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    await prisma.patient.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), deletedBy: session?.user?.id },
    })
    return NextResponse.json({ message: "Patient deleted" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete patient" }, { status: 500 })
  }
}
