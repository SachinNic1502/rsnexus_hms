"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Pill, Clock, Utensils, FileText, Search, Loader2 } from 'lucide-react'

interface Medicine {
  id: string
  name: string
  dose: string
  frequency: string
  duration: string
  instructions: string
  timing: string
  foodInstruction: string
  usageInstructions: string
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
    timing: '',
    foodInstruction: '',
    usageInstructions: '',
  })
  const [entryMode, setEntryMode] = useState<'search' | 'manual'>('search')
  const [medicineSearch, setMedicineSearch] = useState('')
  const [medicineResults, setMedicineResults] = useState<any[]>([])
  const [searchingMeds, setSearchingMeds] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (entryMode !== 'search' || medicineSearch.length < 2) {
      setMedicineResults([])
      return
    }
    setSearchingMeds(true)
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/medicines?search=${encodeURIComponent(medicineSearch)}`)
        if (res.ok) {
          const data = await res.json()
          setMedicineResults(Array.isArray(data) ? data : [])
        }
      } catch {
        setMedicineResults([])
      } finally {
        setSearchingMeds(false)
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [medicineSearch, entryMode])

  const selectMedicine = (med: any) => {
    setCurrentMedicine({ ...currentMedicine, name: med.name })
    setMedicineSearch(med.name)
    setMedicineResults([])
  }

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

  const timings = [
    'Morning',
    'Afternoon',
    'Night',
    'Morning & Night',
    'Morning & Afternoon',
    'Afternoon & Night',
    'Morning, Afternoon & Night',
    'Before breakfast',
    'After breakfast',
    'Before lunch',
    'After lunch',
    'Before dinner',
    'After dinner',
  ]

  const foodInstructions = [
    'Before food',
    'After food',
    'With food',
    'Empty stomach',
    'No food restriction',
    'Take with milk',
    'Take with water',
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
      timing: '',
      foodInstruction: '',
      usageInstructions: '',
    })
    setMedicineSearch('')
    setMedicineResults([])
    if (entryMode === 'search' && searchRef.current) {
      searchRef.current.focus()
    }
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
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => { setEntryMode('search'); setMedicineSearch(''); setMedicineResults([]) }}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${entryMode === 'search' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <Search className="h-3 w-3 inline mr-1" /> Search Medicine
            </button>
            <button
              type="button"
              onClick={() => { setEntryMode('manual'); setMedicineSearch(''); setMedicineResults([]) }}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${entryMode === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <Pill className="h-3 w-3 inline mr-1" /> Manual Entry
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 relative">
              <label htmlFor="medicineName" className="text-sm font-medium">
                Medicine Name *
              </label>
              {entryMode === 'search' ? (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    ref={searchRef}
                    value={medicineSearch}
                    onChange={(e) => { setMedicineSearch(e.target.value); setCurrentMedicine({ ...currentMedicine, name: '' }) }}
                    placeholder="Search medicine..."
                    className="pl-10"
                  />
                  {searchingMeds && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />}
                  {medicineResults.length > 0 && (
                    <div className="absolute z-20 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-auto mt-1">
                      {medicineResults.map((med: any) => (
                        <div
                          key={med.id}
                          className="p-2.5 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-0"
                          onClick={() => selectMedicine(med)}
                        >
                          <span className="font-medium">{med.name}</span>
                          {med.genericName && <span className="text-gray-500 ml-2">({med.genericName})</span>}
                          <span className="text-gray-400 ml-2 text-xs">{med.unit} - ₹{med.price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {medicineSearch.length >= 2 && !searchingMeds && medicineResults.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">No medicines found. <button type="button" className="text-blue-600 hover:underline" onClick={() => setEntryMode('manual')}>Switch to manual entry</button></p>
                  )}
                </div>
              ) : (
                <Input
                  id="medicineName"
                  value={currentMedicine.name}
                  onChange={(e) =>
                    setCurrentMedicine({ ...currentMedicine, name: e.target.value })
                  }
                  placeholder="e.g., Paracetamol"
                />
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="timing" className="text-sm font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" /> Timing
              </label>
              <select
                id="timing"
                value={currentMedicine.timing}
                onChange={(e) =>
                  setCurrentMedicine({ ...currentMedicine, timing: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select timing</option>
                {timings.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="foodInstruction" className="text-sm font-medium flex items-center gap-1">
                <Utensils className="h-3 w-3" /> Food Instruction
              </label>
              <select
                id="foodInstruction"
                value={currentMedicine.foodInstruction}
                onChange={(e) =>
                  setCurrentMedicine({ ...currentMedicine, foodInstruction: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select food instruction</option>
                {foodInstructions.map((fi) => (
                  <option key={fi} value={fi}>
                    {fi}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="usageInstructions" className="text-sm font-medium flex items-center gap-1">
                <FileText className="h-3 w-3" /> Usage Instructions
              </label>
              <Input
                id="usageInstructions"
                value={currentMedicine.usageInstructions}
                onChange={(e) =>
                  setCurrentMedicine({ ...currentMedicine, usageInstructions: e.target.value })
                }
                placeholder="e.g., Take with water"
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
                      {medicine.timing && <p>Timing: {medicine.timing}</p>}
                      {medicine.foodInstruction && <p>Food: {medicine.foodInstruction}</p>}
                      {medicine.usageInstructions && <p>Usage: {medicine.usageInstructions}</p>}
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
