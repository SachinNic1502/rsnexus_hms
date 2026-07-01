import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateAppointmentSchema = z.object({
  doctorId: z.string().min(1).optional(),
  departmentId: z.string().min(1).optional(),
  date: z.string().min(1).optional(),
  time: z.string().min(1).optional(),
  consultationType: z.enum(["new", "follow_up"]).optional(),
  status: z.enum(["scheduled", "waiting", "in_progress", "completed", "cancelled"]).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        department: true,
        consultation: true,
      },
    })

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    return NextResponse.json(appointment)
  } catch {
    return NextResponse.json({ error: "Failed to fetch appointment" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = updateAppointmentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 })
    }

    const existing = await prisma.appointment.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    const data: Record<string, unknown> = {}

    if (parsed.data.status) data.status = parsed.data.status

    const newDate = parsed.data.date ? new Date(parsed.data.date) : undefined
    const newTime = parsed.data.time
    const newDoctorId = parsed.data.doctorId || existing.doctorId

    if (newDate) data.date = newDate
    if (newTime) data.time = newTime
    if (parsed.data.doctorId) data.doctorId = parsed.data.doctorId
    if (parsed.data.departmentId) data.departmentId = parsed.data.departmentId
    if (parsed.data.consultationType) data.consultationType = parsed.data.consultationType

    if (newDate || newTime || parsed.data.doctorId) {
      const checkDate = newDate || existing.date
      const checkTime = newTime || existing.time
      const checkDoctor = newDoctorId

      const dayStart = new Date(checkDate)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(checkDate)
      dayEnd.setHours(23, 59, 59, 999)

      const conflicting = await prisma.appointment.findFirst({
        where: {
          doctorId: checkDoctor,
          date: { gte: dayStart, lte: dayEnd },
          time: checkTime,
          status: { not: "cancelled" },
          id: { not: id },
        },
        select: { id: true, appointmentNumber: true },
      })

      if (conflicting) {
        return NextResponse.json(
          { error: `Time slot ${checkTime} is already booked for this doctor (${conflicting.appointmentNumber}). Please choose another slot.` },
          { status: 409 }
        )
      }

      if (newDate || parsed.data.doctorId) {
        const countDayStart = new Date(checkDate)
        countDayStart.setHours(0, 0, 0, 0)
        const countDayEnd = new Date(checkDate)
        countDayEnd.setHours(23, 59, 59, 999)

        data.tokenNumber = await prisma.appointment.count({
          where: {
            doctorId: checkDoctor,
            date: { gte: countDayStart, lte: countDayEnd },
          },
        }) + 1
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data,
      include: {
        patient: true,
        doctor: { include: { user: true } },
        department: true,
      },
    })

    return NextResponse.json(appointment)
  } catch {
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 })
  }
}
