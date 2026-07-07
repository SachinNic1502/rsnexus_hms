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
    const doctorId = searchParams.get("doctorId")

    const where: AppointmentWhereInput = {}
    where.isDeleted = false

    if (status && status !== "all") {
      where.status = status as 'scheduled' | 'waiting' | 'in_progress' | 'completed' | 'cancelled'
    }
    if (date) {
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)
      where.date = { gte: dayStart, lte: dayEnd }
    }
    if (doctorId) {
      where.doctorId = doctorId
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: true,
        doctor: { include: { user: true } },
        department: true,
      },
      orderBy: { createdAt: "desc" },
    })

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

    const { patientId, doctorId, departmentId, date, time, consultationType, temperature, bloodPressure, pulse, oxygenSaturation, weight, height } = parsed.data

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
        isDeleted: false,
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
      orderBy: { appointmentNumber: "desc" },
      select: { appointmentNumber: true },
    })

    let appointmentNumber = generateSequentialNumber("APT", lastAppointment?.appointmentNumber)

    let exists = await prisma.appointment.findFirst({
      where: { appointmentNumber },
    })

    while (exists) {
      appointmentNumber = generateSequentialNumber("APT", appointmentNumber)
      exists = await prisma.appointment.findFirst({
        where: { appointmentNumber },
      })
    }

    const tokenNumber = await prisma.appointment.count({
      where: {
        doctorId,
        date: { gte: dayStart, lte: dayEnd },
        isDeleted: false,
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
        temperature: temperature ? parseFloat(temperature) : undefined,
        bloodPressure: bloodPressure || undefined,
        pulse: pulse ? parseInt(pulse) : undefined,
        oxygenSaturation: oxygenSaturation ? parseInt(oxygenSaturation) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseFloat(height) : undefined,
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        department: true,
      },
    })

    // Query OPD Consultation Fee service from catalog
    const consultationFeeService = await prisma.service.findFirst({
      where: {
        isActive: true,
        name: { contains: "consultation", mode: "insensitive" },
      },
    })

    if (consultationFeeService) {
      const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6).toUpperCase()}`
      await prisma.invoice.create({
        data: {
          patientId,
          appointmentId: appointment.id,
          invoiceNumber,
          type: "OPD",
          subtotal: consultationFeeService.price,
          tax: 0,
          discount: 0,
          total: consultationFeeService.price,
          status: "pending",
          items: {
            create: [
              {
                description: `OPD Consultation Fee - Dr. ${appointment.doctor.user.name}`,
                quantity: 1,
                unitPrice: consultationFeeService.price,
                total: consultationFeeService.price,
                type: "service",
              }
            ]
          }
        }
      })
    }

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST appointment")
  }
}
