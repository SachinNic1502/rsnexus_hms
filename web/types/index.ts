// User Roles
export type UserRole = 
  | 'super_admin'
  | 'hospital_admin'
  | 'receptionist'
  | 'doctor'
  | 'nurse'
  | 'lab_technician'
  | 'pharmacist'
  | 'billing_staff'

// User
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  hospitalId?: string
}

// Patient
export interface Patient {
  id: string
  uhid: string
  name: string
  mobile: string
  gender: 'male' | 'female' | 'other'
  dateOfBirth?: Date
  age?: number
  address: string
  bloodGroup?: string
  emergencyContact?: string
  emergencyContactNumber?: string
  createdAt: Date
  updatedAt: Date
}

// Department
export interface Department {
  id: string
  name: string
  description?: string
}

// Doctor
export interface Doctor {
  id: string
  userId: string
  name: string
  departmentId: string
  specialization: string
  qualification: string
  available: boolean
}

// Appointment
export type AppointmentStatus = 'scheduled' | 'waiting' | 'in_progress' | 'completed' | 'cancelled'
export type ConsultationType = 'new' | 'follow_up'

export interface Appointment {
  id: string
  patientId: string
  doctorId: string
  departmentId: string
  date: Date
  time: string
  consultationType: ConsultationType
  status: AppointmentStatus
  appointmentNumber: string
  tokenNumber: number
  createdAt: Date
}

// Consultation
export interface Consultation {
  id: string
  appointmentId: string
  patientId: string
  doctorId: string
  chiefComplaint: string
  symptoms: string
  diagnosis: string
  vitals?: Vitals
  clinicalNotes: string
  createdAt: Date
  updatedAt: Date
}

// Vitals
export interface Vitals {
  temperature?: number
  bloodPressure?: string
  pulse?: number
  respiratoryRate?: number
  oxygenSaturation?: number
  weight?: number
  height?: number
}

// Prescription
export interface Prescription {
  id: string
  consultationId: string
  patientId: string
  doctorId: string
  medicines: PrescriptionMedicine[]
  createdAt: Date
}

export interface PrescriptionMedicine {
  medicineId: string
  medicineName: string
  dose: string
  frequency: string
  duration: string
  instructions?: string
}

// Medicine
export interface Medicine {
  id: string
  name: string
  genericName?: string
  manufacturer?: string
  category?: string
  stock: number
  unit: string
  price: number
}

// Lab Test
export interface LabTest {
  id: string
  name: string
  category: string
  price: number
  description?: string
}

// Lab Order
export type LabOrderStatus = 'pending' | 'in_progress' | 'completed'

export interface LabOrder {
  id: string
  patientId: string
  consultationId?: string
  testIds: string[]
  status: LabOrderStatus
  orderedAt: Date
  completedAt?: Date
}

// Lab Report
export interface LabReport {
  id: string
  labOrderId: string
  results: LabResult[]
  uploadedAt: Date
  uploadedBy: string
}

export interface LabResult {
  testId: string
  testName: string
  result: string
  normalRange?: string
  isAbnormal: boolean
}

// Admission
export type AdmissionStatus = 'admitted' | 'discharged'

export interface Admission {
  id: string
  patientId: string
  doctorId: string
  // Assigned by a nurse after admission; null until a bed is allocated.
  wardId?: string | null
  roomId?: string | null
  bedId?: string | null
  admissionNumber: string
  admissionDate: Date
  dischargeDate?: Date
  status: AdmissionStatus
  dischargeSummary?: string
  finalDiagnosis?: string
  followUpDate?: Date
}

// Ward
export interface Ward {
  id: string
  name: string
  floor: number
  type: 'general' | 'icu' | 'emergency' | 'private'
}

// Room
export interface Room {
  id: string
  wardId: string
  roomNumber: string
  type: 'general' | 'private' | 'semi_private'
  bedCount: number
  chargesPerDay: number
}

// Bed
export type BedStatus = 'available' | 'occupied' | 'maintenance'

export interface Bed {
  id: string
  roomId: string
  bedNumber: string
  status: BedStatus
  currentPatientId?: string
}

// Invoice
export type InvoiceStatus = 'pending' | 'partial' | 'paid' | 'cancelled'

export interface Invoice {
  id: string
  patientId: string
  admissionId?: string
  appointmentId?: string
  items: InvoiceItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  status: InvoiceStatus
  createdAt: Date
  paidAt?: Date
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  type: 'service' | 'medicine' | 'lab' | 'room' | 'other'
}

// Payment
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'bank_transfer' | 'insurance'

export interface Payment {
  id: string
  invoiceId: string
  amount: number
  method: PaymentMethod
  transactionId?: string
  paidAt: Date
  receivedBy: string
}

// Service
export interface Service {
  id: string
  name: string
  category: string
  price: number
  description?: string
}
