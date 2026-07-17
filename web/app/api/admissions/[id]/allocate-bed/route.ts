import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { allocateBedSchema } from "@/lib/validations"
import { handleApiError } from "@/lib/error-handler"

// Nurse assigns a Ward + Room + Bed to an already-admitted patient.
//
// Guarantees enforced here (see Objective §7 Validation):
//  - Ward, Room and Bed must all be supplied (schema).
//  - The admission must exist and still be "admitted".
//  - The admission must not already have a bed (no duplicate allocation).
//  - The chosen bed must belong to the chosen room, and the room to the ward.
//  - The bed must be "available"; occupied/maintenance beds are rejected.
//  - The bed grab is atomic (updateMany filtered on status) so two nurses
//    cannot allocate the same bed to two patients in a race.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = allocateBedSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please select a Ward, Room and Bed", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { wardId, roomId, bedId } = parsed.data

    const admission = await prisma.admission.findUnique({ where: { id } })
    if (!admission) {
      return NextResponse.json({ error: "Admission not found" }, { status: 404 })
    }
    if (admission.status !== "admitted") {
      return NextResponse.json(
        { error: "Cannot allocate a bed to a patient who is not currently admitted" },
        { status: 400 }
      )
    }
    if (admission.bedId) {
      return NextResponse.json(
        { error: "This admission already has a bed assigned" },
        { status: 409 }
      )
    }

    // Validate the ward → room → bed relationship against the existing Ward
    // Management structure so a nurse cannot allocate a mismatched combination.
    const bed = await prisma.bed.findFirst({
      where: { id: bedId, isDeleted: { isSet: false } },
      include: { room: true },
    })
    if (!bed) {
      return NextResponse.json({ error: "Selected bed not found" }, { status: 404 })
    }
    if (bed.roomId !== roomId || bed.room.wardId !== wardId) {
      return NextResponse.json(
        { error: "Selected bed does not belong to the chosen ward and room" },
        { status: 400 }
      )
    }
    if (bed.status !== "available") {
      return NextResponse.json(
        { error: "Selected bed is no longer available" },
        { status: 409 }
      )
    }

    // Atomic allocation: grab the bed only if it is still available, and update
    // the admission only if it still has no bed. If either guard fails we abort
    // the whole transaction so bed occupancy and the admission stay in sync.
    const allocated = await prisma.$transaction(async (tx) => {
      const bedGrab = await tx.bed.updateMany({
        where: { id: bedId, status: "available", isDeleted: { isSet: false } },
        data: { status: "occupied", currentPatientId: admission.patientId },
      })
      if (bedGrab.count === 0) {
        throw new Error("BED_TAKEN")
      }

      // Guard: only allocate if this admission still has no bed. On MongoDB an
      // unassigned admission stores `bedId` as *unset* (not null), and a `null`
      // filter does not match unset fields — so match both representations to
      // keep the race-guard correct.
      const admissionUpdate = await tx.admission.updateMany({
        where: {
          id,
          status: "admitted",
          OR: [{ bedId: { isSet: false } }, { bedId: null }],
        },
        data: { wardId, roomId, bedId },
      })
      if (admissionUpdate.count === 0) {
        throw new Error("ALREADY_ALLOCATED")
      }

      return tx.admission.findUnique({
        where: { id },
        include: {
          patient: true,
          doctor: { include: { user: true } },
          ward: true,
          room: true,
          bed: true,
        },
      })
    })

    return NextResponse.json(allocated, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message === "BED_TAKEN") {
      return NextResponse.json({ error: "Selected bed was just taken by someone else" }, { status: 409 })
    }
    if (error instanceof Error && error.message === "ALREADY_ALLOCATED") {
      return NextResponse.json({ error: "This admission already has a bed assigned" }, { status: 409 })
    }
    return handleApiError(error, "POST allocate bed")
  }
}
