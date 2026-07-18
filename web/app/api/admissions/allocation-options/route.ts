import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleApiError } from "@/lib/error-handler"

// Nurse-accessible read of the existing Ward → Room → Bed structure, used to
// populate the Bed Allocation modal. This lives under /api/admissions (which
// nurses may access) so we can reuse the existing Ward Management data without
// loosening the admin-only /api/wards, /api/rooms or /api/beds endpoints.
//
// Returns the same ward/room/bed hierarchy the Ward Management module uses,
// with per-ward and per-room occupancy stats, so the modal can show live
// availability and disable occupied beds.
export async function GET() {
  try {
    const wards = await prisma.ward.findMany({
      where: { OR: [{ isDeleted: { isSet: false } }, { isDeleted: false }] },
      include: {
        rooms: {
          where: { OR: [{ isDeleted: { isSet: false } }, { isDeleted: false }] },
          include: {
            beds: {
              where: { OR: [{ isDeleted: { isSet: false } }, { isDeleted: false }] },
              orderBy: { bedNumber: "asc" },
            },
          },
          orderBy: { roomNumber: "asc" },
        },
      },
      orderBy: { name: "asc" },
    })

    const result = wards.map((ward) => {
      const rooms = ward.rooms.map((room) => {
        const beds = room.beds.map((bed) => ({
          id: bed.id,
          bedNumber: bed.bedNumber,
          status: bed.status,
        }))
        return {
          id: room.id,
          roomNumber: room.roomNumber,
          type: room.type,
          chargesPerDay: room.chargesPerDay,
          beds,
          availableBeds: beds.filter((b) => b.status === "available").length,
        }
      })
      const allBeds = rooms.flatMap((r) => r.beds)
      return {
        id: ward.id,
        name: ward.name,
        type: ward.type,
        floor: ward.floor,
        rooms,
        totalBeds: allBeds.length,
        availableBeds: allBeds.filter((b) => b.status === "available").length,
        occupiedBeds: allBeds.filter((b) => b.status === "occupied").length,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error, "GET admission allocation options")
  }
}
