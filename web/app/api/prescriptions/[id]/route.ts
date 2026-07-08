import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        consultation: true,
        medicines: true,
      },
    })

    if (!prescription) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 })
    }

    return NextResponse.json(prescription)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch prescription" }, { status: 500 })
  }
}

function parseQuantity(duration: string, frequency: string): number {
  const daysMatch = duration.match(/(\d+)/)
  const days = daysMatch ? parseInt(daysMatch[1]) : 1

  let timesPerDay = 1
  const freqLower = frequency.toLowerCase()
  if (freqLower.includes("twice") || freqLower.includes("bd") || freqLower.includes("b.i.d")) {
    timesPerDay = 2
  } else if (freqLower.includes("three") || freqLower.includes("thrice") || freqLower.includes("tds") || freqLower.includes("t.i.d")) {
    timesPerDay = 3
  } else if (freqLower.includes("four") || freqLower.includes("qds") || freqLower.includes("q.i.d")) {
    timesPerDay = 4
  } else if (freqLower.includes("once") || freqLower.includes("od")) {
    timesPerDay = 1
  }

  return days * timesPerDay
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    const existing = await prisma.prescription.findUnique({
      where: { id },
      include: { medicines: true }
    })

    if (!existing) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 })
    }

    if (status === "dispensed" && existing.status !== "dispensed") {
      const updates: { medicineId: string; quantity: number }[] = []
      
      for (const med of existing.medicines) {
        if (!med.medicineId) continue
        
        const medicine = await prisma.medicine.findUnique({
          where: { id: med.medicineId }
        })
        
        if (!medicine) {
          return NextResponse.json({ error: `Medicine ${med.medicineName} not found in inventory` }, { status: 404 })
        }

        const requiredQty = parseQuantity(med.duration, med.frequency)
        if (medicine.stock < requiredQty) {
          return NextResponse.json({
            error: `Insufficient stock for ${medicine.name}. Available: ${medicine.stock}, Required: ${requiredQty}`
          }, { status: 400 })
        }
        
        updates.push({ medicineId: med.medicineId, quantity: requiredQty })
      }

      await prisma.$transaction(async (tx) => {
        for (const update of updates) {
          await tx.medicine.update({
            where: { id: update.medicineId },
            data: { stock: { decrement: update.quantity } }
          })
        }
        
        await tx.prescription.update({
          where: { id },
          data: { status }
        })
      })

      const prescription = await prisma.prescription.findUnique({
        where: { id },
        include: {
          patient: true,
          doctor: { include: { user: true } },
          consultation: true,
          medicines: true,
        },
      })
      return NextResponse.json(prescription)
    }

    const prescription = await prisma.prescription.update({
      where: { id },
      data: { status },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        consultation: true,
        medicines: true,
      },
    })

    return NextResponse.json(prescription)
  } catch (error) {
    console.error("PUT prescription error:", error)
    return NextResponse.json({ error: "Failed to update prescription" }, { status: 500 })
  }
}
