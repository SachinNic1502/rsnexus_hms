import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleApiError } from "@/lib/error-handler"
import { computeDueDate } from "@/lib/utils"

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    // Start of the current calendar month (for monthly revenue).
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    const [
      todayAppointments,
      admittedPatients,
      totalBeds,
      occupiedBeds,
      pendingBills,
      paidBills,
      partialBills,
      dailyRevenueAgg,
      monthlyRevenueAgg,
      outstandingInvoices,
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
      // Phase 8 billing metrics
      prisma.invoice.count({ where: { status: "paid" } }),
      prisma.invoice.count({ where: { status: "partial" } }),
      // Daily revenue = payments actually collected today (not invoiced total).
      prisma.payment.aggregate({
        where: { paidAt: { gte: today, lt: tomorrow } },
        _sum: { amount: true },
      }),
      // Monthly revenue = payments collected since the start of this month.
      prisma.payment.aggregate({
        where: { paidAt: { gte: monthStart, lt: tomorrow } },
        _sum: { amount: true },
      }),
      // Unpaid / partially-paid invoices, with payments, so we can compute the
      // true outstanding amount (total − payments) and a pending-bills table.
      prisma.invoice.findMany({
        where: { status: { in: ["pending", "partial"] } },
        include: { patient: true, payments: true },
        orderBy: { createdAt: "asc" },
      }),
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

    // True outstanding amount = Σ(invoice.total − payments) across unpaid /
    // partial invoices. This is payment-adjusted, unlike pendingBillTotal
    // (which sums the full invoice total and overstates partials). We keep
    // pendingBillTotal for backward compatibility and add the accurate figure.
    const nowMs = Date.now()
    const dayMs = 1000 * 60 * 60 * 24
    let outstandingAmount = 0
    const pendingInvoices = outstandingInvoices.map((inv) => {
      const paid = inv.payments.reduce((sum, p) => sum + p.amount, 0)
      const remaining = inv.total - paid
      outstandingAmount += remaining
      const dueDate = inv.dueDate ?? computeDueDate(inv.createdAt)
      const daysPending = Math.max(0, Math.floor((nowMs - new Date(inv.createdAt).getTime()) / dayMs))
      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        patient: inv.patient.name,
        type: inv.type,
        status: inv.status,
        total: inv.total,
        paid,
        remaining,
        invoiceDate: inv.createdAt,
        dueDate,
        daysPending,
        overdue: dueDate.getTime() < nowMs,
      }
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
        // Phase 8 billing/payment metrics
        paidBills,
        partialBills,
        outstandingAmount,
        dailyRevenue: dailyRevenueAgg._sum.amount || 0,
        monthlyRevenue: monthlyRevenueAgg._sum.amount || 0,
      },
      // Pending-bills table data (invoice date, due date, days pending).
      pendingInvoices,
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
