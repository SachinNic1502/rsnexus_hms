"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Pill } from 'lucide-react'

interface Medicine {
  id: string
  name: string
  dose: string
  instructions: string
}

interface MedicineOption {
  id: string
  name: string
}

interface PrescriptionFormProps {
  onSave: (medicines: Medicine[]) => void
  onCancel: () => void
  medicineOptions?: MedicineOption[]
  readOnly?: boolean
}

export function PrescriptionForm({ onSave, onCancel, medicineOptions = [], readOnly = false }: PrescriptionFormProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [currentMedicine, setCurrentMedicine] = useState({
    name: '',
    dose: '',
    instructions: '',
  })

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
      instructions: '',
    })
  }

  const quickAddMedicine = (name: string) => {
    setMedicines(prev => [...prev, { id: `${Date.now()}-${name}`, name, dose: '', instructions: '' }])
  }

  const removeMedicine = (id: string) => {
    setMedicines(medicines.filter((m) => m.id !== id))
  }

  const updateMedicineDose = (id: string, dose: string) => {
    setMedicines(medicines.map((m) => (m.id === id ? { ...m, dose } : m)))
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
                list={medicineOptions.length > 0 ? 'medicine-master-options' : undefined}
                disabled={readOnly}
              />
              {medicineOptions.length > 0 && (
                <datalist id="medicine-master-options">
                  {medicineOptions.map((m) => (
                    <option key={m.id} value={m.name} />
                  ))}
                </datalist>
              )}
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
                disabled={readOnly}
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
              disabled={readOnly}
            />
          </div>
          <Button onClick={addMedicine} className="w-full" disabled={readOnly}>
            <Plus className="mr-2 h-4 w-4" />
            Add to Prescription
          </Button>

          {medicineOptions.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm font-medium">Or pick from existing medicines</p>
              <div className="max-h-40 overflow-auto flex flex-wrap gap-2">
                {medicineOptions.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => quickAddMedicine(m.name)}
                    disabled={readOnly}
                    className="px-3 py-1.5 text-xs rounded-full border bg-white hover:bg-blue-50 hover:border-blue-300 text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          )}
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
                      <Input
                        value={medicine.dose}
                        onChange={(e) => updateMedicineDose(medicine.id, e.target.value)}
                        placeholder="Dose, e.g. 500mg"
                        className="h-7 w-36 text-xs"
                        disabled={readOnly}
                      />
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {medicine.instructions && <p>Note: {medicine.instructions}</p>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMedicine(medicine.id)}
                    disabled={readOnly}
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
        <Button onClick={handleSave} disabled={readOnly || medicines.length === 0}>
          Save Prescription
        </Button>
      </div>
    </div>
  )
}
