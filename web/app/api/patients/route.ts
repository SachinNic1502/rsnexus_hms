import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { patientSchema } from "@/lib/validations"
import { handleApiError } from "@/lib/error-handler"
import { generateSequentialNumber } from "@/lib/utils"
import type { PatientWhereInput } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const searchType = searchParams.get("searchType") || "name"

    const where: PatientWhereInput = { isDeleted: { isSet: false } }
    if (search) {
      if (searchType === "uhid") {
        where.uhid = { contains: search, mode: "insensitive" }
      } else if (searchType === "mobile") {
        where.mobile = { contains: search }
      } else {
        where.name = { contains: search, mode: "insensitive" }
      }
    }

    const patients = await prisma.patient.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { appointments: true, admissions: true },
        },
        // Latest appointment — used to derive the patient's current workflow
        // status on the Patients list (Scheduled / In Queue / In Progress /
        // Completed). Additive, does not change existing fields.
        appointments: {
          where: { isDeleted: { isSet: false } },
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
          take: 1,
          select: { status: true, date: true },
        },
        // Active (not-yet-discharged) admissions — an active admission means
        // the patient is currently an inpatient (IPD).
        admissions: {
          where: { status: "admitted" },
          select: { id: true },
          take: 1,
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
      where: { mobile, isDeleted: { isSet: false } },
      select: { id: true, uhid: true, name: true },
    })
    if (existingPatient) {
      return NextResponse.json(
        { error: `Patient already exists with this mobile number (${existingPatient.name}, UHID: ${existingPatient.uhid})` },
        { status: 409 }
      )
    }

    const lastPatient = await prisma.patient.findFirst({
      orderBy: { createdAt: "desc" },
      select: { uhid: true },
    })

    const uhid = generateSequentialNumber("UHID", lastPatient?.uhid)

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
      },
    })

    return NextResponse.json(patient, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST patient")
  }
}
