"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Pill } from 'lucide-react'

interface Medicine {
  id: string
  name: string
  dose: string
  frequency: string
  duration: string
  instructions: string
}

interface PrescriptionFormProps {
  onSave: (medicines: Medicine[]) => void
  onCancel: () => void
}

export function PrescriptionForm({ onSave, onCancel }: PrescriptionFormProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [currentMedicine, setCurrentMedicine] = useState({
    name: '',
    dose: '',
    frequency: '',
    duration: '',
    instructions: '',
  })

  const frequencies = [
    'Once daily',
    'Twice daily',
    'Three times daily',
    'Four times daily',
    'Every 8 hours',
    'Every 12 hours',
    'Every 6 hours',
    'As needed',
    'Before meals',
    'After meals',
  ]

  const addMedicine = () => {
    if (!currentMedicine.name || !currentMedicine.dose) {
      alert('Please enter medicine name and dose')
      return
    }

    const newMedicine: Medicine = {
      id: Date.now().toString(),
      ...currentMedicine,
    }

    setMedicines([...medicines, newMedicine])
    setCurrentMedicine({
      name: '',
      dose: '',
      frequency: '',
      duration: '',
      instructions: '',
    })
  }

  const removeMedicine = (id: string) => {
    setMedicines(medicines.filter((m) => m.id !== id))
  }

  const handleSave = () => {
    if (medicines.length === 0) {
      alert('Please add at least one medicine')
      return
    }
    onSave(medicines)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Add Medicine
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="medicineName" className="text-sm font-medium">
                Medicine Name *
              </label>
              <Input
                id="medicineName"
                value={currentMedicine.name}
                onChange={(e) =>
                  setCurrentMedicine({ ...currentMedicine, name: e.target.value })
                }
                placeholder="e.g., Paracetamol"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="dose" className="text-sm font-medium">
                Dose *
              </label>
              <Input
                id="dose"
                value={currentMedicine.dose}
                onChange={(e) =>
                  setCurrentMedicine({ ...currentMedicine, dose: e.target.value })
                }
                placeholder="e.g., 500mg"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="frequency" className="text-sm font-medium">
                Frequency
              </label>
              <select
                id="frequency"
                value={currentMedicine.frequency}
                onChange={(e) =>
                  setCurrentMedicine({ ...currentMedicine, frequency: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select frequency</option>
                {frequencies.map((freq) => (
                  <option key={freq} value={freq}>
                    {freq}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="duration" className="text-sm font-medium">
                Duration
              </label>
              <Input
                id="duration"
                value={currentMedicine.duration}
                onChange={(e) =>
                  setCurrentMedicine({ ...currentMedicine, duration: e.target.value })
                }
                placeholder="e.g., 5 days"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="instructions" className="text-sm font-medium">
              Special Instructions
            </label>
            <textarea
              id="instructions"
              value={currentMedicine.instructions}
              onChange={(e) =>
                setCurrentMedicine({ ...currentMedicine, instructions: e.target.value })
              }
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="e.g., Take after food"
            />
          </div>
          <Button onClick={addMedicine} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add to Prescription
          </Button>
        </CardContent>
      </Card>

      {/* Added Medicines List */}
      {medicines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prescription List ({medicines.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {medicines.map((medicine) => (
                <div
                  key={medicine.id}
                  className="flex items-start justify-between p-4 rounded-lg border bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{medicine.name}</h4>
                      <Badge variant="outline">{medicine.dose}</Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {medicine.frequency && <p>Frequency: {medicine.frequency}</p>}
                      {medicine.duration && <p>Duration: {medicine.duration}</p>}
                      {medicine.instructions && <p>Note: {medicine.instructions}</p>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMedicine(medicine.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={medicines.length === 0}>
          Save Prescription
        </Button>
      </div>
    </div>
  )
}
