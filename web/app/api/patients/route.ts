import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { patientSchema } from "@/lib/validations"
import { handleApiError } from "@/lib/error-handler"
import { generateSequentialNumber } from "@/lib/utils"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const searchType = searchParams.get("searchType") || "all"

    const where: any = { isDeleted: false }

    if (search) {
      if (searchType === "uhid") {
        where.uhid = { contains: search, mode: "insensitive" }
      } else if (searchType === "mobile") {
        where.mobile = { contains: search }
      } else if (searchType === "name") {
        where.name = { contains: search, mode: "insensitive" }
      } else {
        // Unified search across name, mobile, and uhid
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { mobile: { contains: search } },
          { uhid: { contains: search, mode: "insensitive" } },
        ]
      }
    }

    const patients = await prisma.patient.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { appointments: true, admissions: true },
        },
      },
    })

    return NextResponse.json(patients)
  } catch (error) {
    return handleApiError(error, "GET patients")
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (body.bloodGroup === null || body.bloodGroup === undefined) body.bloodGroup = ""
    const parsed = patientSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 })
    }

    const { name, mobile, gender, dateOfBirth, age, address, bloodGroup, emergencyContact, emergencyContactNumber } = parsed.data

    const existingPatient = await prisma.patient.findFirst({
      where: { mobile, isDeleted: false },
      select: { id: true, uhid: true, name: true },
    })
    if (existingPatient) {
      return NextResponse.json(
        { error: `Patient already exists with this mobile number (${existingPatient.name}, UHID: ${existingPatient.uhid})` },
        { status: 409 }
      )
    }

    const lastPatient = await prisma.patient.findFirst({
      orderBy: { uhid: "desc" },
      select: { uhid: true },
    })

    let uhid = generateSequentialNumber("UHID", lastPatient?.uhid)

    let exists = await prisma.patient.findUnique({
      where: { uhid },
    })

    while (exists) {
      uhid = generateSequentialNumber("UHID", uhid)
      exists = await prisma.patient.findUnique({
        where: { uhid },
      })
    }

    const patient = await prisma.patient.create({
      data: {
        uhid,
        name,
        mobile,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        age: age ? parseInt(age) : undefined,
        address,
        bloodGroup: bloodGroup || undefined,
        emergencyContact: emergencyContact || undefined,
        emergencyContactNumber: emergencyContactNumber || undefined,
        // Vitals
        bloodPressure: body.bloodPressure || undefined,
        oxygenSaturation: body.oxygenSaturation ? parseInt(body.oxygenSaturation) : undefined,
        height: body.height ? parseFloat(body.height) : undefined,
        weight: body.weight ? parseFloat(body.weight) : undefined,
        temperature: body.temperature ? parseFloat(body.temperature) : undefined,
        pulse: body.pulse ? parseInt(body.pulse) : undefined,
      },
    })

    return NextResponse.json(patient, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST patient")
  }
}
