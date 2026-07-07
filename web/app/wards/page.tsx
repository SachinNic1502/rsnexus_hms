"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Bed, DoorOpen, Building2, Loader2, Trash2, Edit } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

interface Bed {
  id: string
  bedNumber: string
  status: string
  admission?: { patient: { name: string }; doctor: { user: { name: string } } } | null
}

interface Room {
  id: string
  roomNumber: string
  type: string
  bedCount: number
  beds: Bed[]
}

interface Ward {
  id: string
  name: string
  type: string
  floor: number
  totalBeds: number
  availableBeds: number
  occupiedBeds: number
  rooms: Room[]
}

const wardTypeColors: Record<string, string> = {
  general: 'bg-blue-100 text-blue-800',
  icu: 'bg-red-100 text-red-800',
  emergency: 'bg-orange-100 text-orange-800',
  private: 'bg-purple-100 text-purple-800',
}

const bedStatusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-800 border-green-300',
  occupied: 'bg-red-100 text-red-800 border-red-300',
  maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-300',
}

export default function WardsPage() {
  const { toast } = useToast()
  const [wards, setWards] = useState<Ward[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedWard, setExpandedWard] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingWard, setEditingWard] = useState<Ward | null>(null)
  const [formData, setFormData] = useState({ name: '', type: 'general', floor: 1 })
  const [saving, setSaving] = useState(false)
  const [showRoomForm, setShowRoomForm] = useState<string | null>(null)
  const [roomForm, setRoomForm] = useState({ roomNumber: '', type: 'general', bedCount: '4', chargesPerDay: '500', autoCreateBeds: true })
  const [savingRoom, setSavingRoom] = useState(false)

  useEffect(() => { fetchWards() }, [])

  const fetchWards = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wards')
      if (res.ok) { const data = await res.json(); setWards(Array.isArray(data) ? data : []) }
    } catch (e) { toast('Failed to fetch wards', 'error') }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = editingWard ? `/api/wards/${editingWard.id}` : '/api/wards'
      const method = editingWard ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setShowForm(false)
        setEditingWard(null)
        setFormData({ name: '', type: 'general', floor: 1 })
        fetchWards()
      }
    } catch (e) { toast('Failed to save ward', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this ward?')) return
    try {
      const res = await fetch(`/api/wards/${id}`, { method: 'DELETE' })
      if (res.ok) fetchWards()
      else {
        const data = await res.json()
        alert(data.error || 'Failed to delete')
      }
    } catch (e) { toast('Failed to delete ward', 'error') }
  }

  const startEdit = (ward: Ward) => {
    setEditingWard(ward)
    setFormData({ name: ward.name, type: ward.type, floor: ward.floor })
    setShowForm(true)
  }

  const handleCreateRoom = async (wardId: string) => {
    if (!roomForm.roomNumber || !roomForm.chargesPerDay) return
    setSavingRoom(true)
    try {
      const r = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wardId, ...roomForm, bedCount: parseInt(roomForm.bedCount) || 4, chargesPerDay: parseFloat(roomForm.chargesPerDay) || 0 }),
      })
      if (r.ok) { setShowRoomForm(null); setRoomForm({ roomNumber: '', type: 'general', bedCount: '4', chargesPerDay: '500', autoCreateBeds: true }); fetchWards() }
    } catch (e) { toast('Failed to create room', 'error') }
    finally { setSavingRoom(false) }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ward Management</h1>
            <p className="text-gray-600 mt-1">Manage wards, rooms, and beds</p>
          </div>
          <div className="flex gap-2">
            <Link href="/wards/beds">
              <Button variant="outline"><Bed className="mr-2 h-4 w-4" /> Bed Dashboard</Button>
            </Link>
            <Button onClick={() => { setEditingWard(null); setFormData({ name: '', type: 'general', floor: 1 }); setShowForm(true) }}>
              <Plus className="mr-2 h-4 w-4" /> Add Ward
            </Button>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingWard ? 'Edit Ward' : 'Add New Ward'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ward Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  placeholder="e.g. General Ward A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="general">General</option>
                  <option value="icu">ICU</option>
                  <option value="emergency">Emergency</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                <input
                  type="number"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 1 })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  min={1}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSave} disabled={saving || !formData.name}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingWard ? 'Update' : 'Create'}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingWard(null) }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Wards', value: wards.length, icon: Building2 },
          { label: 'Total Beds', value: wards.reduce((s, w) => s + w.totalBeds, 0), icon: Bed },
          { label: 'Available', value: wards.reduce((s, w) => s + w.availableBeds, 0), icon: Bed },
          { label: 'Occupied', value: wards.reduce((s, w) => s + w.occupiedBeds, 0), icon: Bed },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <stat.icon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ward List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : wards.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No wards configured</p>
          <Button className="mt-4" size="sm" onClick={() => { setEditingWard(null); setFormData({ name: '', type: 'general', floor: 1 }); setShowForm(true) }}>
            <Plus className="mr-2 h-4 w-4" /> Add Ward
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {wards.map((ward) => {
            const isExpanded = expandedWard === ward.id
            const occupancyRate = ward.totalBeds > 0 ? Math.round((ward.occupiedBeds / ward.totalBeds) * 100) : 0

            return (
              <Card key={ward.id}>
                <CardContent className="p-0">
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedWard(isExpanded ? null : ward.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{ward.name}</h3>
                            <Badge className={wardTypeColors[ward.type]}>{ward.type}</Badge>
                            <span className="text-sm text-gray-500">Floor {ward.floor}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span>{ward.rooms.length} rooms</span>
                            <span>{ward.totalBeds} beds</span>
                            <span className="text-green-600">{ward.availableBeds} available</span>
                            <span className="text-red-600">{ward.occupiedBeds} occupied</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${occupancyRate > 80 ? 'bg-red-500' : occupancyRate > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${occupancyRate}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{occupancyRate}% occupied</p>
                        </div>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" onClick={() => startEdit(ward)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(ward.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-700">Rooms & Beds</h4>
                        <Button size="sm" variant="outline" onClick={() => setShowRoomForm(showRoomForm === ward.id ? null : ward.id)}>
                          <Plus className="h-4 w-4 mr-1" /> Add Room
                        </Button>
                      </div>

                      {showRoomForm === ward.id && (
                        <Card className="mb-4">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-5 gap-3 items-end">
                              <div><label className="text-xs font-medium">Room # *</label><input value={roomForm.roomNumber} onChange={e => setRoomForm({ ...roomForm, roomNumber: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="e.g. 101" /></div>
                              <div><label className="text-xs font-medium">Type</label><select value={roomForm.type} onChange={e => setRoomForm({ ...roomForm, type: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"><option value="general">General</option><option value="private">Private</option><option value="semi_private">Semi-Private</option></select></div>
                              <div><label className="text-xs font-medium">Beds</label><input type="number" value={roomForm.bedCount} onChange={e => setRoomForm({ ...roomForm, bedCount: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" min="1" /></div>
                              <div><label className="text-xs font-medium">₹/Day</label><input type="number" value={roomForm.chargesPerDay} onChange={e => setRoomForm({ ...roomForm, chargesPerDay: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" /></div>
                              <div className="flex gap-1"><Button size="sm" onClick={() => handleCreateRoom(ward.id)} disabled={savingRoom || !roomForm.roomNumber}>{savingRoom ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}</Button><Button size="sm" variant="ghost" onClick={() => setShowRoomForm(null)}>Cancel</Button></div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {ward.rooms.map((room) => (
                        <div key={room.id} className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <DoorOpen className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">Room {room.roomNumber}</span>
                            <Badge variant="outline">{room.type}</Badge>
                            <span className="text-sm text-gray-500">({room.beds.length} beds)</span>
                          </div>
                          <div className="grid grid-cols-6 gap-2 ml-6">
                            {room.beds.map((bed) => (
                              <div
                                key={bed.id}
                                className={`p-2 rounded border text-center text-sm ${bedStatusColors[bed.status]}`}
                              >
                                <p className="font-medium">{bed.bedNumber}</p>
                                <p className="text-xs capitalize">{bed.status}</p>
                                {bed.admission && (
                                  <p className="text-xs mt-1 truncate" title={bed.admission.patient.name}>
                                    {bed.admission.patient.name}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
