import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const today = new Date()
    const dayStart = new Date(today)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(today)
    dayEnd.setHours(23, 59, 59, 999)

    const appointments = await prisma.appointment.findMany({
      where: {
        status: "completed",
        isDeleted: false,
        date: { gte: dayStart, lte: dayEnd },
      },
      include: {
        patient: {
          include: {
            admissions: {
              where: { status: "admitted" },
              take: 1,
            },
          }
        },
        doctor: { include: { user: true } },
        department: true,
        consultation: true,
        invoices: {
          where: { isDeleted: false },
        },
      },
      orderBy: { date: "desc" },
    })

    const queue = appointments.map((apt) => {
      const isAdmitted = apt.patient.admissions.length > 0
      const hasInvoice = apt.invoices.length > 0
      
      return {
        id: apt.id,
        appointmentNumber: apt.appointmentNumber,
        tokenNumber: apt.tokenNumber,
        time: apt.time,
        date: apt.date,
        status: apt.status,
        patient: {
          id: apt.patient.id,
          name: apt.patient.name,
          uhid: apt.patient.uhid,
          mobile: apt.patient.mobile,
        },
        doctor: {
          id: apt.doctor.id,
          name: apt.doctor.user.name,
        },
        department: apt.department.name,
        isAdmitted,
        hasInvoice,
        invoiceId: hasInvoice ? apt.invoices[0].id : null,
        consultationId: apt.consultation?.id || null,
      }
    })

    return NextResponse.json(queue)
  } catch (error) {
    console.error("GET billing-queue error:", error)
    return NextResponse.json({ error: "Failed to fetch billing queue" }, { status: 500 })
  }
}
