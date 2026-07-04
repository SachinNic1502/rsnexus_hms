import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleApiError } from "@/lib/error-handler"

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [
      todayAppointments,
      admittedPatients,
      totalBeds,
      occupiedBeds,
      pendingBills,
      doctors,
      recentAppointments,
      recentAdmissions,
    ] = await Promise.all([
      prisma.appointment.count({
        where: {
          date: { gte: today, lt: tomorrow },
          status: { not: "cancelled" },
          isDeleted: { isSet: false },
        },
      }),
      prisma.admission.count({ where: { status: "admitted" } }),
      prisma.bed.count({ where: { status: { not: "maintenance" }, isDeleted: { isSet: false } } }),
      prisma.bed.count({ where: { status: "occupied", isDeleted: { isSet: false } } }),
      prisma.invoice.count({ where: { status: { in: ["pending", "partial"] } } }),
      prisma.doctor.findMany({
        include: { user: true, department: true },
      }),
      prisma.appointment.findMany({
        where: { date: { gte: today, lt: tomorrow }, status: { not: "cancelled" }, isDeleted: { isSet: false } },
        include: { patient: true, doctor: { include: { user: true } }, department: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.admission.findMany({
        where: { status: "admitted" },
        include: {
          patient: true,
          ward: true,
          room: true,
          bed: true,
        },
        orderBy: { admissionDate: "desc" },
        take: 5,
      }),
    ])

    const pendingBillTotal = await prisma.invoice.aggregate({
      where: { status: { in: ["pending", "partial"] } },
      _sum: { total: true },
    })

    return NextResponse.json({
      stats: {
        todayAppointments,
        admittedPatients,
        availableBeds: totalBeds - occupiedBeds,
        totalBeds,
        occupiedBeds,
        pendingBills,
        pendingBillTotal: pendingBillTotal._sum.total || 0,
      },
      doctors: doctors.map((d) => ({
        id: d.id,
        name: d.user.name,
        department: d.department.name,
        available: d.available,
      })),
      recentAppointments: recentAppointments.map((a) => ({
        id: a.id,
        patient: a.patient.name,
        doctor: `Dr. ${a.doctor.user.name}`,
        time: a.time,
        status: a.status,
      })),
      recentAdmissions: recentAdmissions.map((a) => ({
        id: a.id,
        patient: a.patient.name,
        ward: a.ward.name,
        room: a.room.roomNumber,
        bed: a.bed.bedNumber,
        admittedAt: a.admissionDate,
      })),
    })
  } catch (error) {
    return handleApiError(error, "Dashboard API")
  }
}
