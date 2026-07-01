import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const dailyRoundSchema = z.object({
  admissionId: z.string().min(1, "Admission is required"),
  doctorId: z.string().min(1, "Doctor is required"),
  temperature: z.number().optional(),
  bloodPressure: z.string().optional().or(z.literal("")),
  pulse: z.number().int().optional(),
  respiratoryRate: z.number().int().optional(),
  oxygenSaturation: z.number().int().optional(),
  notes: z.string().min(1, "Notes are required"),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const admissionId = searchParams.get("admissionId")

    const where: any = {}
    if (admissionId) where.admissionId = admissionId

    const dailyRounds = await prisma.dailyRound.findMany({
      where,
      orderBy: { date: "desc" },
    })

    return NextResponse.json(dailyRounds)
  } catch (error) {
    console.error("GET daily rounds error:", error)
    return NextResponse.json({ error: "Failed to fetch daily rounds" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = dailyRoundSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 })
    }

    const { admissionId, doctorId, temperature, bloodPressure, pulse, respiratoryRate, oxygenSaturation, notes } = parsed.data

    const dailyRound = await prisma.dailyRound.create({
      data: {
        admissionId,
        doctorId,
        temperature: temperature ?? null,
        bloodPressure: bloodPressure || null,
        pulse: pulse ?? null,
        respiratoryRate: respiratoryRate ?? null,
        oxygenSaturation: oxygenSaturation ?? null,
        notes,
      },
    })

    return NextResponse.json(dailyRound, { status: 201 })
  } catch (error) {
    console.error("POST daily round error:", error)
    return NextResponse.json({ error: "Failed to create daily round" }, { status: 500 })
  }
}
