"use client"

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, X, Building2, DoorOpen, Bed } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

// Shared "Assign Ward & Bed" modal used by the Nurse Bed Allocation screen and
// the IPD Admission Details page. It loads the existing Ward → Room → Bed
// structure (via the nurse-accessible allocation-options endpoint), lets the
// user pick a ward and then any available bed shown under its rooms, and posts
// the allocation. It never mutates any data itself beyond the single allocate
// call, and reports success back to the parent so the parent can refresh.

interface OptionBed { id: string; bedNumber: string; status: string }
interface OptionRoom { id: string; roomNumber: string; type: string; chargesPerDay: number; beds: OptionBed[]; availableBeds: number }
interface OptionWard { id: string; name: string; type: string; floor: number; rooms: OptionRoom[]; totalBeds: number; availableBeds: number; occupiedBeds: number }

export interface AllocatableAdmission {
  id: string
  patient: { name: string; uhid: string }
}

const wardTypeColors: Record<string, string> = {
  general: 'bg-blue-100 text-blue-800',
  icu: 'bg-red-100 text-red-800',
  emergency: 'bg-orange-100 text-orange-800',
  private: 'bg-purple-100 text-purple-800',
}

export function BedAllocationModal({
  admission,
  onClose,
  onAllocated,
}: {
  // Non-null => modal is open for this admission. Null => closed.
  admission: AllocatableAdmission | null
  onClose: () => void
  onAllocated: () => void
}) {
  const { toast } = useToast()
  const [wards, setWards] = useState<OptionWard[]>([])
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [wardId, setWardId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [bedId, setBedId] = useState('')
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState('')

  const admissionId = admission?.id ?? null

  // Load the ward/room/bed options fresh each time the modal opens, and reset
  // any prior selection so a reused modal never carries stale state.
  useEffect(() => {
    if (!admissionId) return
    setWardId(''); setRoomId(''); setBedId(''); setModalError('')
    setOptionsLoading(true)
    let cancelled = false
    fetch('/api/admissions/allocation-options')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (!cancelled) setWards(Array.isArray(d) ? d : []) })
      .catch(() => { if (!cancelled) toast('Failed to load wards', 'error') })
      .finally(() => { if (!cancelled) setOptionsLoading(false) })
    return () => { cancelled = true }
  }, [admissionId, toast])

  const selectedWard = useMemo(() => wards.find((w) => w.id === wardId) || null, [wards, wardId])

  const closeModal = () => {
    if (saving) return
    onClose()
  }

  // Selecting a ward clears any room/bed picked in a previously-selected ward.
  const handleWardChange = (id: string) => { setWardId(id); setRoomId(''); setBedId(''); setModalError('') }
  // Picking a bed captures its room too, so ward + room + bed are always in sync.
  const selectBed = (room: OptionRoom, bed: OptionBed) => {
    setRoomId(room.id); setBedId(bed.id); setModalError('')
  }

  const handleAllocate = async () => {
    if (!admission) return
    if (!wardId || !roomId || !bedId) {
      setModalError('Please select a ward, room and bed before allocating.')
      return
    }
    setSaving(true)
    setModalError('')
    try {
      const res = await fetch(`/api/admissions/${admission.id}/allocate-bed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wardId, roomId, bedId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setModalError(data.error || 'Failed to allocate bed')
        // Refresh options so a bed taken by someone else disappears immediately.
        fetch('/api/admissions/allocation-options').then(r => r.ok ? r.json() : null).then(d => { if (Array.isArray(d)) setWards(d) })
        return
      }
      toast('Bed allocated successfully', 'success')
      onAllocated()
    } catch {
      setModalError('Failed to allocate bed')
    } finally {
      setSaving(false)
    }
  }

  if (!admission) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={closeModal} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-semibold">Assign Ward &amp; Bed</h2>
            <p className="text-sm text-gray-500">{admission.patient.name} · {admission.patient.uhid}</p>
          </div>
          <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded" disabled={saving}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {modalError && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{modalError}</div>
          )}

          {optionsLoading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
          ) : (
            <>
              {/* Step 1: Ward */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2"><Building2 className="h-4 w-4 text-gray-400" /> Ward</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {wards.map((w) => {
                    const disabled = w.availableBeds === 0
                    const active = w.id === wardId
                    return (
                      <button
                        key={w.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleWardChange(w.id)}
                        className={`text-left p-3 rounded-lg border transition-colors ${
                          active ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                          : disabled ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-medium text-sm truncate">{w.name}</span>
                          <Badge className={`${wardTypeColors[w.type] || 'bg-gray-100 text-gray-700'} shrink-0`}>{w.type}</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{w.availableBeds} of {w.totalBeds} beds free</p>
                      </button>
                    )
                  })}
                </div>
                {wards.length === 0 && <p className="text-sm text-gray-500">No wards configured. Add wards in Ward Management first.</p>}
              </div>

              {/* Step 2: Rooms & Beds — every room of the selected ward, with its
                  beds shown inline (mirrors the Ward Management layout). Pick an
                  available bed directly; occupied beds are disabled. */}
              {selectedWard && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-3"><DoorOpen className="h-4 w-4 text-gray-400" /> Rooms &amp; Beds</label>
                  {selectedWard.rooms.length === 0 ? (
                    <p className="text-sm text-gray-500">This ward has no rooms.</p>
                  ) : (
                    <div className="space-y-4">
                      {selectedWard.rooms.map((room) => (
                        <div key={room.id}>
                          <div className="flex items-center gap-2 mb-2">
                            <DoorOpen className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-sm">Room {room.roomNumber}</span>
                            <Badge variant="outline" className="capitalize">{room.type.replace('_', ' ')}</Badge>
                            <span className="text-xs text-gray-500">({room.beds.length} beds · {room.availableBeds} free · ₹{room.chargesPerDay}/day)</span>
                          </div>
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {room.beds.map((b) => {
                              const isAvailable = b.status === 'available'
                              const active = b.id === bedId
                              return (
                                <button
                                  key={b.id}
                                  type="button"
                                  disabled={!isAvailable}
                                  title={isAvailable ? `Bed ${b.bedNumber}` : `Bed ${b.bedNumber} — ${b.status}`}
                                  onClick={() => selectBed(room, b)}
                                  className={`p-2 rounded-md border text-center transition-colors ${
                                    active ? 'border-blue-500 bg-blue-500 text-white'
                                    : isAvailable ? 'border-green-300 bg-green-50 text-green-800 hover:bg-green-100'
                                    : 'border-red-200 bg-red-50 text-red-400 cursor-not-allowed opacity-70'
                                  }`}
                                >
                                  <p className="font-semibold text-sm">{b.bedNumber}</p>
                                  <p className="text-[10px] capitalize">{isAvailable ? 'available' : b.status}</p>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 p-6 border-t sticky bottom-0 bg-white">
          <Button variant="outline" onClick={closeModal} disabled={saving}>Cancel</Button>
          <Button onClick={handleAllocate} disabled={saving || !wardId || !roomId || !bedId}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bed className="mr-2 h-4 w-4" />}
            Allocate Bed
          </Button>
        </div>
      </div>
    </div>
  )
}
