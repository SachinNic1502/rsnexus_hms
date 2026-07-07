import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notifications: any[] = []

    if (user.role === "pharmacist" || user.role === "super_admin" || user.role === "hospital_admin") {
      const lowStockMedicines = await prisma.medicine.findMany({
        where: { stock: { lte: 10 }, isDeleted: false },
        select: { id: true, name: true, stock: true },
        take: 5,
      })
      lowStockMedicines.forEach((med) => {
        notifications.push({
          id: `low-stock-${med.id}`,
          title: `Low Stock: ${med.name}`,
          message: `Only ${med.stock} units remaining in stock.`,
          type: "warning",
          link: "/medicines",
        })
      })
    }

    if (user.role === "doctor" || user.role === "super_admin") {
      const doctor = await prisma.doctor.findFirst({
        where: { userId: user.id },
      })
      if (doctor) {
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        
        const appointments = await prisma.appointment.findMany({
          where: {
            doctorId: doctor.id,
            status: "waiting",
            date: { gte: todayStart },
            isDeleted: false,
          },
          include: { patient: true },
          take: 5,
        })
        appointments.forEach((appt) => {
          notifications.push({
            id: `appt-wait-${appt.id}`,
            title: `Patient Waiting: ${appt.patient.name}`,
            message: `Checked in and waiting for OPD consultation.`,
            type: "info",
            link: "/opd",
          })
        })
      }
    }

    if (user.role === "lab_technician" || user.role === "super_admin" || user.role === "hospital_admin") {
      const pendingLabOrders = await prisma.labOrder.findMany({
        where: { status: "pending", isDeleted: false },
        include: { patient: true },
        take: 5,
      })
      pendingLabOrders.forEach((order) => {
        notifications.push({
          id: `lab-order-${order.id}`,
          title: `New Lab Order: ${order.orderNumber}`,
          message: `Pending tests for patient ${order.patient.name}.`,
          type: "info",
          link: `/lab`,
        })
      })
    }

    if (user.role === "nurse" || user.role === "super_admin" || user.role === "hospital_admin") {
      const activeAdmissions = await prisma.admission.findMany({
        where: { status: "admitted", isDeleted: false },
        include: { patient: true, ward: true, room: true },
        orderBy: { admissionDate: "desc" },
        take: 5,
      })
      activeAdmissions.forEach((adm) => {
        notifications.push({
          id: `admission-${adm.id}`,
          title: `New Admission: ${adm.patient.name}`,
          message: `Admitted to Ward: ${adm.ward.name}, Room: ${adm.room.roomNumber}.`,
          type: "info",
          link: "/ipd",
        })
      })
    }

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("GET notifications error:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}
