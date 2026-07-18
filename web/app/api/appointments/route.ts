import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { appointmentSchema } from "@/lib/validations"
import { handleApiError } from "@/lib/error-handler"
import { generateSequentialNumber } from "@/lib/utils"
import type { AppointmentWhereInput } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const date = searchParams.get("date")
    // Optional date range (inclusive) used by the weekly calendar to load a
    // whole week at once. Takes precedence over the single `date` param.
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const doctorId = searchParams.get("doctorId")
    // Opt-in: alongside the given date, also surface earlier appointments
    // that were never resolved (still scheduled/waiting/in_progress), so a
    // patient checked in one day and not yet seen doesn't silently drop out
    // of the queue on the next day. Off by default — existing callers of
    // this endpoint keep the exact current date-only behavior.
    const includeOverdue = searchParams.get("includeOverdue") === "true"

    const where: AppointmentWhereInput = { OR: [{ isDeleted: { isSet: false } }, { isDeleted: false }] }
    if (status && status !== "all") {
      where.status = status as 'scheduled' | 'waiting' | 'in_progress' | 'completed' | 'cancelled'
    }
    if (from && to) {
      const rangeStart = new Date(from)
      rangeStart.setHours(0, 0, 0, 0)
      const rangeEnd = new Date(to)
      rangeEnd.setHours(23, 59, 59, 999)
      where.date = { gte: rangeStart, lte: rangeEnd }
    } else if (date) {
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)
      if (includeOverdue) {
        where.OR = [
          { date: { gte: dayStart, lte: dayEnd } },
          { status: { in: ['scheduled', 'waiting', 'in_progress'] }, date: { lt: dayStart } },
        ]
      } else {
        where.date = { gte: dayStart, lte: dayEnd }
      }
    }
    if (doctorId) {
      where.doctorId = doctorId
    }

    // Patient is a required relation, but some appointments point at a
    // patientId whose Patient no longer exists (deleted without cleaning up
    // its appointments). Prisma's include throws "Field patient is required
    // ... got null" the moment one of those is touched, so patients are
    // fetched separately and joined in, silently skipping any appointment
    // whose patient can no longer be found instead of 500ing the whole list.
    const rawAppointments = await prisma.appointment.findMany({
      where,
      include: {
        doctor: { include: { user: true } },
        department: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const patientIds = [...new Set(rawAppointments.map((a) => a.patientId))]
    const patients = await prisma.patient.findMany({
      where: { id: { in: patientIds } },
      // Active admission (if any) lets the UI route an admitted patient's
      // card to the OPD Patient Details (Admission) page instead of the
      // plain patient profile.
      include: { admissions: { where: { status: "admitted" }, select: { id: true }, take: 1 } },
    })
    const patientById = new Map(patients.map((p) => [p.id, p]))

    const appointments = rawAppointments
      .filter((a) => patientById.has(a.patientId))
      .map((a) => ({ ...a, patient: patientById.get(a.patientId)! }))

    return NextResponse.json(appointments)
  } catch (error) {
    return handleApiError(error, "GET appointments")
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = appointmentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 })
    }

    const { patientId, doctorId, departmentId, date, time, consultationType } = parsed.data

    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    const existingSlot = await prisma.appointment.findFirst({
      where: {
        doctorId,
        date: { gte: dayStart, lte: dayEnd },
        time,
        status: { not: 'cancelled' },
        OR: [{ isDeleted: { isSet: false } }, { isDeleted: false }],
      },
      select: { id: true, appointmentNumber: true },
    })
    if (existingSlot) {
      return NextResponse.json(
        { error: `Time slot ${time} is already booked for this doctor (${existingSlot.appointmentNumber}). Please choose another slot.` },
        { status: 409 }
      )
    }

    const lastAppointment = await prisma.appointment.findFirst({
      orderBy: { createdAt: "desc" },
      select: { appointmentNumber: true },
    })

    const appointmentNumber = generateSequentialNumber("APT", lastAppointment?.appointmentNumber)

    const tokenNumber = await prisma.appointment.count({
      where: {
        doctorId,
        date: { gte: dayStart, lte: dayEnd },
        OR: [{ isDeleted: { isSet: false } }, { isDeleted: false }],
      },
    }) + 1

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        departmentId,
        date: new Date(date),
        time,
        consultationType,
        appointmentNumber,
        tokenNumber,
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        department: true,
      },
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST appointment")
  }
}
