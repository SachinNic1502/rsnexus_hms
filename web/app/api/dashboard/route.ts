import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleApiError } from "@/lib/error-handler"
import { getAuthUser } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { role, id: userId } = user

    // ─── DOCTOR DASHBOARD ──────────────────────────────────────
    if (role === "doctor") {
      const doctor = await prisma.doctor.findUnique({
        where: { userId },
      })
      const doctorId = doctor?.id || ""

      const [
        todayAppointments,
        waitingQueue,
        completedConsultations,
        recentAppointments,
      ] = await Promise.all([
        prisma.appointment.count({
          where: {
            doctorId,
            date: { gte: today, lt: tomorrow },
            status: { not: "cancelled" },
          },
        }),
        prisma.appointment.count({
          where: {
            doctorId,
            date: { gte: today, lt: tomorrow },
            status: "waiting",
          },
        }),
        prisma.appointment.count({
          where: {
            doctorId,
            date: { gte: today, lt: tomorrow },
            status: "completed",
          },
        }),
        prisma.appointment.findMany({
          where: { doctorId, date: { gte: today, lt: tomorrow }, status: { not: "cancelled" } },
          include: { patient: true, department: true },
          orderBy: { tokenNumber: "asc" },
          take: 10,
        }),
      ])

      return NextResponse.json({
        stats: {
          todayAppointments,
          waitingQueue,
          completedConsultations,
        },
        recentAppointments: recentAppointments.map((a) => ({
          id: a.id,
          patient: a.patient.name,
          time: a.time,
          status: a.status,
          tokenNumber: a.tokenNumber,
        })),
      })
    }

    // ─── NURSE DASHBOARD ───────────────────────────────────────
    if (role === "nurse") {
      const [
        admittedPatients,
        totalBeds,
        occupiedBeds,
        roundsLoggedToday,
        recentAdmissions,
        pendingOpdBills,
        recentPendingOpdBills,
      ] = await Promise.all([
        prisma.admission.count({ where: { status: "admitted" } }),
        prisma.bed.count({ where: { status: { not: "maintenance" } } }),
        prisma.bed.count({ where: { status: "occupied" } }),
        prisma.dailyRound.count({
          where: { date: { gte: today, lt: tomorrow } },
        }),
        prisma.admission.findMany({
          where: { status: "admitted" },
          include: { patient: true, ward: true, room: true, bed: true },
          orderBy: { admissionDate: "desc" },
          take: 5,
        }),
        prisma.appointment.count({
          where: {
            status: "completed",
            isDeleted: false,
            patient: {
              admissions: {
                none: { status: "admitted" }
              }
            },
            invoices: {
              none: { isDeleted: false }
            }
          }
        }),
        prisma.appointment.findMany({
          where: {
            status: "completed",
            isDeleted: false,
            patient: {
              admissions: {
                none: { status: "admitted" }
              }
            },
            invoices: {
              none: { isDeleted: false }
            }
          },
          include: { patient: true, doctor: { include: { user: true } }, department: true },
          orderBy: { date: "desc" },
          take: 5,
        }),
      ])

      return NextResponse.json({
        stats: {
          admittedPatients,
          availableBeds: totalBeds - occupiedBeds,
          totalBeds,
          occupiedBeds,
          roundsLoggedToday,
          pendingOpdBills,
        },
        recentAdmissions: recentAdmissions.map((a) => ({
          id: a.id,
          patient: a.patient.name,
          ward: a.ward.name,
          room: a.room.roomNumber,
          bed: a.bed.bedNumber,
          admittedAt: a.admissionDate,
        })),
        recentPendingOpdBills: recentPendingOpdBills.map((apt) => ({
          id: apt.id,
          patient: apt.patient.name,
          doctor: `Dr. ${apt.doctor.user.name}`,
          department: apt.department.name,
          time: apt.time,
        })),
      })
    }

    // ─── PHARMACIST DASHBOARD ──────────────────────────────────
    if (role === "pharmacist") {
      const [
        lowStockMedicines,
        totalMedicines,
        prescriptionsToday,
        recentPrescriptions,
      ] = await Promise.all([
        prisma.medicine.count({ where: { stock: { lte: 20 }, isDeleted: false } }),
        prisma.medicine.count({ where: { isDeleted: false } }),
        prisma.prescription.count({
          where: { createdAt: { gte: today, lt: tomorrow }, isDeleted: false },
        }),
        prisma.prescription.findMany({
          where: { isDeleted: false },
          include: { patient: true, doctor: { include: { user: true } }, medicines: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ])

      return NextResponse.json({
        stats: {
          lowStockMedicines,
          totalMedicines,
          prescriptionsToday,
        },
        recentPrescriptions: recentPrescriptions.map((p) => ({
          id: p.id,
          patient: p.patient.name,
          doctor: `Dr. ${p.doctor.user.name}`,
          medicinesCount: p.medicines.length,
          createdAt: p.createdAt,
        })),
      })
    }

    // ─── LAB TECHNICIAN DASHBOARD ──────────────────────────────
    if (role === "lab_technician") {
      const [
        pendingLabOrders,
        inProgressLabOrders,
        completedToday,
        recentLabOrders,
      ] = await Promise.all([
        prisma.labOrder.count({ where: { status: "pending", isDeleted: false } }),
        prisma.labOrder.count({ where: { status: "in_progress", isDeleted: false } }),
        prisma.labOrder.count({
          where: { status: "completed", completedAt: { gte: today, lt: tomorrow }, isDeleted: false },
        }),
        prisma.labOrder.findMany({
          where: { isDeleted: false },
          include: { patient: true, doctor: { include: { user: true } }, tests: true },
          orderBy: { orderedAt: "desc" },
          take: 5,
        }),
      ])

      return NextResponse.json({
        stats: {
          pendingLabOrders,
          inProgressLabOrders,
          completedToday,
        },
        recentLabOrders: recentLabOrders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          patient: o.patient.name,
          doctor: `Dr. ${o.doctor.user.name}`,
          status: o.status,
          testsCount: o.tests.length,
        })),
      })
    }

    // ─── BILLING STAFF DASHBOARD ────────────────────────────────
    if (role === "billing_staff") {
      const [
        pendingBills,
        invoicesToday,
        revenueTodayAggregate,
        recentPendingInvoices,
      ] = await Promise.all([
        prisma.invoice.count({ where: { status: { in: ["pending", "partial"] }, isDeleted: false } }),
        prisma.invoice.count({ where: { createdAt: { gte: today, lt: tomorrow }, isDeleted: false } }),
        prisma.payment.aggregate({
          where: { paidAt: { gte: today, lt: tomorrow }, isDeleted: false },
          _sum: { amount: true },
        }),
        prisma.invoice.findMany({
          where: { status: { in: ["pending", "partial"] }, isDeleted: false },
          include: { patient: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ])

      return NextResponse.json({
        stats: {
          pendingBills,
          invoicesToday,
          revenueToday: revenueTodayAggregate._sum.amount || 0,
        },
        recentPendingInvoices: recentPendingInvoices.map((i) => ({
          id: i.id,
          invoiceNumber: i.invoiceNumber,
          patient: i.patient.name,
          total: i.total,
          status: i.status,
          createdAt: i.createdAt,
        })),
      })
    }

    if (role === "receptionist") {
      const [
        todayAppointments,
        waitingQueue,
        completedVisits,
        pendingBills,
        recentAppointments,
        recentPendingInvoices,
      ] = await Promise.all([
        prisma.appointment.count({
          where: { date: { gte: today, lt: tomorrow }, status: { not: "cancelled" } },
        }),
        prisma.appointment.count({
          where: { date: { gte: today, lt: tomorrow }, status: "waiting" },
        }),
        prisma.appointment.count({
          where: { date: { gte: today, lt: tomorrow }, status: "completed" },
        }),
        prisma.invoice.count({ where: { status: { in: ["pending", "partial"] }, isDeleted: false } }),
        prisma.appointment.findMany({
          where: { date: { gte: today, lt: tomorrow }, status: { not: "cancelled" } },
          include: { patient: true, doctor: { include: { user: true } }, department: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        prisma.invoice.findMany({
          where: { status: { in: ["pending", "partial"] }, isDeleted: false },
          include: { patient: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ])

      return NextResponse.json({
        stats: {
          todayAppointments,
          waitingQueue,
          completedVisits,
          pendingBills,
        },
        recentAppointments: recentAppointments.map((a) => ({
          id: a.id,
          patient: a.patient.name,
          doctor: `Dr. ${a.doctor.user.name}`,
          department: a.department.name,
          time: a.time,
          status: a.status,
        })),
        recentPendingInvoices: recentPendingInvoices.map((i) => ({
          id: i.id,
          invoiceNumber: i.invoiceNumber,
          patient: i.patient.name,
          total: i.total,
          status: i.status,
          createdAt: i.createdAt,
        })),
      })
    }

    // ─── ADMIN DASHBOARD (DEFAULT OVERVIEW) ────────────────────
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
        },
      }),
      prisma.admission.count({ where: { status: "admitted" } }),
      prisma.bed.count({ where: { status: { not: "maintenance" } } }),
      prisma.bed.count({ where: { status: "occupied" } }),
      prisma.invoice.count({ where: { status: { in: ["pending", "partial"] }, isDeleted: false } }),
      prisma.doctor.findMany({
        where: { isDeleted: false },
        include: { user: true, department: true },
      }),
      prisma.appointment.findMany({
        where: { date: { gte: today, lt: tomorrow }, status: { not: "cancelled" } },
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
      where: { status: { in: ["pending", "partial"] }, isDeleted: false },
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

