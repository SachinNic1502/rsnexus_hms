import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleApiError } from "@/lib/error-handler"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "daily"
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0]
    const month = searchParams.get("month") || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
    const doctorId = searchParams.get("doctorId")

    if (type === "daily") {
      return dailyReport(date)
    } else if (type === "monthly") {
      return monthlyReport(month)
    } else if (type === "revenue") {
      return revenueReport(month)
    } else if (type === "doctor-performance") {
      return doctorPerformanceReport(month, doctorId)
    } else if (type === "bed-occupancy") {
      return bedOccupancyReport()
    }

    return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
  } catch (error) {
    return handleApiError(error, "Report API")
  }
}

async function dailyReport(dateStr: string) {
  const date = new Date(dateStr)
  const nextDay = new Date(date)
  nextDay.setDate(nextDay.getDate() + 1)

  const [appointments, admissions, discharges, invoices, labOrders] = await Promise.all([
    prisma.appointment.findMany({
      where: { date: { gte: date, lt: nextDay }, isDeleted: { isSet: false } },
      include: { patient: true, doctor: { include: { user: true } }, department: true },
    }),
    prisma.admission.findMany({
      where: { admissionDate: { gte: date, lt: nextDay } },
      include: { patient: true, ward: true, bed: true, doctor: { include: { user: true } } },
    }),
    prisma.admission.findMany({
      where: {
        dischargeDate: { gte: date, lt: nextDay },
        status: "discharged",
      },
      include: { patient: true, ward: true, bed: true },
    }),
    prisma.invoice.findMany({
      where: { createdAt: { gte: date, lt: nextDay } },
      include: { items: true, payments: true },
    }),
    prisma.labOrder.findMany({
      where: { orderedAt: { gte: date, lt: nextDay } },
      include: { tests: true, patient: true },
    }),
  ])

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0)
  const totalCollected = invoices.reduce(
    (sum, inv) => sum + inv.payments.reduce((pSum, p) => pSum + p.amount, 0),
    0
  )

  return NextResponse.json({
    date: dateStr,
    summary: {
      totalAppointments: appointments.length,
      completedAppointments: appointments.filter((a) => a.status === "completed").length,
      cancelledAppointments: appointments.filter((a) => a.status === "cancelled").length,
      newAdmissions: admissions.length,
      discharges: discharges.length,
      totalRevenue,
      totalCollected,
      pendingAmount: totalRevenue - totalCollected,
      labOrders: labOrders.length,
      labCompleted: labOrders.filter((l) => l.status === "completed").length,
    },
    appointments: appointments.map((a) => ({
      number: a.appointmentNumber,
      patient: a.patient.name,
      doctor: `Dr. ${a.doctor.user.name}`,
      department: a.department.name,
      time: a.time,
      status: a.status,
      type: a.consultationType,
    })),
    admissions: admissions.map((a) => ({
      number: a.admissionNumber,
      patient: a.patient.name,
      doctor: `Dr. ${a.doctor.user.name}`,
      ward: a.ward?.name ?? "Not assigned",
      bed: a.bed?.bedNumber ?? "-",
    })),
    discharges: discharges.map((d) => ({
      number: d.admissionNumber,
      patient: d.patient.name,
      ward: d.ward?.name ?? "Not assigned",
    })),
    invoices: invoices.map((inv) => ({
      number: inv.invoiceNumber,
      total: inv.total,
      paid: inv.payments.reduce((s, p) => s + p.amount, 0),
      status: inv.status,
    })),
  })
}

async function monthlyReport(month: string) {
  const [year, mon] = month.split("-").map(Number)
  const startDate = new Date(year, mon - 1, 1)
  const endDate = new Date(year, mon, 1)

  const [appointments, admissions, discharges, invoices, labOrders, patients] = await Promise.all([
    prisma.appointment.findMany({
      where: { date: { gte: startDate, lt: endDate }, isDeleted: { isSet: false } },
      include: { doctor: { include: { user: true } }, department: true },
    }),
    prisma.admission.findMany({
      where: { admissionDate: { gte: startDate, lt: endDate } },
      include: { ward: true },
    }),
    prisma.admission.findMany({
      where: { dischargeDate: { gte: startDate, lt: endDate }, status: "discharged" },
    }),
    prisma.invoice.findMany({
      where: { createdAt: { gte: startDate, lt: endDate } },
      include: { items: true, payments: true },
    }),
    prisma.labOrder.findMany({
      where: { orderedAt: { gte: startDate, lt: endDate } },
    }),
    prisma.patient.findMany({
      where: { createdAt: { gte: startDate, lt: endDate }, isDeleted: { isSet: false } },
    }),
  ])

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0)
  const totalCollected = invoices.reduce(
    (sum, inv) => sum + inv.payments.reduce((pSum, p) => pSum + p.amount, 0),
    0
  )

  const departmentStats = appointments.reduce((acc: any, a) => {
    const dept = a.department.name
    if (!acc[dept]) acc[dept] = { name: dept, appointments: 0, completed: 0 }
    acc[dept].appointments++
    if (a.status === "completed") acc[dept].completed++
    return acc
  }, {})

  return NextResponse.json({
    month,
    summary: {
      totalAppointments: appointments.length,
      completedAppointments: appointments.filter((a) => a.status === "completed").length,
      totalAdmissions: admissions.length,
      totalDischarges: discharges.length,
      newPatients: patients.length,
      totalRevenue,
      totalCollected,
      pendingAmount: totalRevenue - totalCollected,
      labOrders: labOrders.length,
    },
    departmentStats: Object.values(departmentStats),
    revenueByType: {
      opd: invoices.filter((i) => i.type === "OPD").reduce((s, i) => s + i.total, 0),
      ipd: invoices.filter((i) => i.type === "IPD").reduce((s, i) => s + i.total, 0),
    },
  })
}

async function revenueReport(month: string) {
  const [year, mon] = month.split("-").map(Number)
  const startDate = new Date(year, mon - 1, 1)
  const endDate = new Date(year, mon, 1)

  const invoices = await prisma.invoice.findMany({
    where: { createdAt: { gte: startDate, lt: endDate } },
    include: { items: true, payments: true, patient: true },
  })

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0)
  const totalCollected = invoices.reduce(
    (sum, inv) => sum + inv.payments.reduce((pSum, p) => pSum + p.amount, 0),
    0
  )

  const byType = {
    opd: invoices.filter((i) => i.type === "OPD"),
    ipd: invoices.filter((i) => i.type === "IPD"),
  }

  const byCategory = invoices.reduce((acc: any, inv) => {
    inv.items.forEach((item) => {
      const cat = item.type
      if (!acc[cat]) acc[cat] = { category: cat, amount: 0, count: 0 }
      acc[cat].amount += item.total
      acc[cat].count++
    })
    return acc
  }, {})

  const byPaymentMethod = invoices.reduce((acc: any, inv) => {
    inv.payments.forEach((p) => {
      const method = p.method
      if (!acc[method]) acc[method] = { method, amount: 0, count: 0 }
      acc[method].amount += p.amount
      acc[method].count++
    })
    return acc
  }, {})

  const dailyRevenue = invoices.reduce((acc: any, inv) => {
    const day = inv.createdAt.toISOString().split("T")[0]
    if (!acc[day]) acc[day] = { date: day, revenue: 0, collected: 0 }
    acc[day].revenue += inv.total
    acc[day].collected += inv.payments.reduce((s, p) => s + p.amount, 0)
    return acc
  }, {})

  return NextResponse.json({
    month,
    summary: {
      totalRevenue,
      totalCollected,
      pendingAmount: totalRevenue - totalCollected,
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter((i) => i.status === "paid").length,
      pendingInvoices: invoices.filter((i) => i.status === "pending" || i.status === "partial").length,
    },
    byType: {
      opd: { count: byType.opd.length, total: byType.opd.reduce((s, i) => s + i.total, 0) },
      ipd: { count: byType.ipd.length, total: byType.ipd.reduce((s, i) => s + i.total, 0) },
    },
    byCategory: Object.values(byCategory),
    byPaymentMethod: Object.values(byPaymentMethod),
    dailyRevenue: Object.values(dailyRevenue).sort((a: any, b: any) => a.date.localeCompare(b.date)),
    topPatients: invoices
      .reduce((acc: any, inv) => {
        const existing = acc.find((a: any) => a.patientId === inv.patientId)
        if (existing) {
          existing.total += inv.total
          existing.invoices++
        } else {
          acc.push({ patientId: inv.patientId, name: inv.patient.name, total: inv.total, invoices: 1 })
        }
        return acc
      }, [])
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 10),
  })
}

async function doctorPerformanceReport(month: string, doctorId?: string | null) {
  const [year, mon] = month.split("-").map(Number)
  const startDate = new Date(year, mon - 1, 1)
  const endDate = new Date(year, mon, 1)

  const where: any = {
    createdAt: { gte: startDate, lt: endDate },
    isDeleted: { isSet: false },
  }
  if (doctorId) where.doctorId = doctorId

  const [appointments, consultations, labOrders, prescriptions] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: { doctor: { include: { user: true, department: true } }, patient: true },
    }),
    prisma.consultation.findMany({
      where: {
        createdAt: { gte: startDate, lt: endDate },
        ...(doctorId ? { doctorId } : {}),
      },
      include: { doctor: { include: { user: true, department: true } }, patient: true },
    }),
    prisma.labOrder.findMany({
      where: {
        orderedAt: { gte: startDate, lt: endDate },
        ...(doctorId ? { doctorId } : {}),
      },
      include: { doctor: { include: { user: true, department: true } }, tests: true },
    }),
    prisma.prescription.findMany({
      where: {
        createdAt: { gte: startDate, lt: endDate },
        ...(doctorId ? { doctorId } : {}),
      },
      include: { doctor: { include: { user: true, department: true } } },
    }),
  ])

  const doctorStats: any = {}
  // Seed a doctor entry from any dataset the first time we see them, so a
  // doctor with (e.g.) consultations but no booked appointments in the period
  // still appears with their real counts instead of being dropped entirely.
  const ensureDoctor = (doc: { id: string; user: { name: string }; department?: { name: string } | null }) => {
    if (!doctorStats[doc.id]) {
      doctorStats[doc.id] = {
        doctorId: doc.id,
        name: doc.user.name,
        department: doc.department?.name || "",
        totalAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        consultations: 0,
        labOrders: 0,
        prescriptions: 0,
      }
    }
    return doctorStats[doc.id]
  }

  appointments.forEach((a) => {
    const stat = ensureDoctor(a.doctor)
    stat.totalAppointments++
    if (a.status === "completed") stat.completedAppointments++
    if (a.status === "cancelled") stat.cancelledAppointments++
  })

  consultations.forEach((c) => {
    ensureDoctor(c.doctor).consultations++
  })

  labOrders.forEach((l) => {
    ensureDoctor(l.doctor).labOrders++
  })

  prescriptions.forEach((p) => {
    ensureDoctor(p.doctor).prescriptions++
  })

  return NextResponse.json({
    month,
    doctors: Object.values(doctorStats).map((d: any) => ({
      ...d,
      completionRate: d.totalAppointments > 0
        ? Math.round((d.completedAppointments / d.totalAppointments) * 100)
        : 0,
    })),
  })
}

async function bedOccupancyReport() {
  const [wards, totalBeds, occupiedBeds, admittedPatients, recentDischarges] = await Promise.all([
    prisma.ward.findMany({
      where: { isDeleted: { isSet: false } },
      include: {
        rooms: {
          where: { isDeleted: { isSet: false } },
          include: {
            beds: {
              where: { isDeleted: { isSet: false } },
              include: {
                // Only the current (active) admission occupies the bed; a bed
                // has many admissions over time, so filter to the admitted one.
                admissions: {
                  where: { status: "admitted" },
                  take: 1,
                  include: { patient: true, doctor: { include: { user: true } } },
                },
              },
            },
          },
        },
      },
    }),
    prisma.bed.count({ where: { status: { not: "maintenance" }, isDeleted: { isSet: false } } }),
    prisma.bed.count({ where: { status: "occupied", isDeleted: { isSet: false } } }),
    prisma.admission.findMany({
      where: { status: "admitted" },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        ward: true,
        room: true,
        bed: true,
      },
      orderBy: { admissionDate: "desc" },
    }),
    prisma.admission.findMany({
      where: { status: "discharged" },
      include: { patient: true, ward: true, bed: true },
      orderBy: { dischargeDate: "desc" },
      take: 20,
    }),
  ])

  const wardStats = wards.map((ward) => {
    const allBeds = ward.rooms.flatMap((r) => r.beds)
    const occupied = allBeds.filter((b) => b.status === "occupied")
    const available = allBeds.filter((b) => b.status === "available")
    const maintenance = allBeds.filter((b) => b.status === "maintenance")
    return {
      id: ward.id,
      name: ward.name,
      type: ward.type,
      floor: ward.floor,
      totalBeds: allBeds.length,
      occupied: occupied.length,
      available: available.length,
      maintenance: maintenance.length,
      occupancyRate: allBeds.length > 0 ? Math.round((occupied.length / allBeds.length) * 100) : 0,
      rooms: ward.rooms.map((room) => ({
        id: room.id,
        number: room.roomNumber,
        type: room.type,
        bedCount: room.bedCount,
        beds: room.beds.map((bed) => {
          const activeAdmission = bed.admissions[0]
          return {
            id: bed.id,
            number: bed.bedNumber,
            status: bed.status,
            patient: activeAdmission?.patient?.name || null,
            doctor: activeAdmission?.doctor ? `Dr. ${activeAdmission.doctor.user.name}` : null,
            admittedAt: activeAdmission?.admissionDate || null,
          }
        }),
      })),
    }
  })

  return NextResponse.json({
    summary: {
      totalBeds,
      occupiedBeds,
      availableBeds: totalBeds - occupiedBeds,
      occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
    },
    wards: wardStats,
    admittedPatients: admittedPatients.map((a) => ({
      patient: a.patient.name,
      ward: a.ward?.name ?? "Not assigned",
      room: a.room?.roomNumber ?? "-",
      bed: a.bed?.bedNumber ?? "-",
      doctor: `Dr. ${a.doctor.user.name}`,
      admittedAt: a.admissionDate,
      daysAdmitted: Math.floor(
        (Date.now() - new Date(a.admissionDate).getTime()) / (1000 * 60 * 60 * 24)
      ),
    })),
    recentDischarges: recentDischarges.map((d) => ({
      patient: d.patient.name,
      ward: d.ward?.name ?? "Not assigned",
      bed: d.bed?.bedNumber ?? "-",
      dischargedAt: d.dischargeDate,
    })),
  })
}
