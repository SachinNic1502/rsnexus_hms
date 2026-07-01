import { z } from 'zod'

// ─── Patient ─────────────────────────────────────────────
export const patientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  mobile: z.string().min(10, 'Mobile must be at least 10 digits').regex(/^\d+$/, 'Mobile must be digits only'),
  gender: z.enum(['male', 'female', 'other'], { message: 'Gender is required' }),
  dateOfBirth: z.string().optional().or(z.literal('')),
  age: z.string().optional().or(z.literal('')),
  address: z.string().min(3, 'Address is required'),
  bloodGroup: z.enum(['A_positive', 'A_negative', 'B_positive', 'B_negative', 'AB_positive', 'AB_negative', 'O_positive', 'O_negative', '']).optional(),
  emergencyContact: z.string().optional().or(z.literal('')),
  emergencyContactNumber: z.string().optional().or(z.literal('')),
})

// ─── Appointment ─────────────────────────────────────────
export const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  doctorId: z.string().min(1, 'Doctor is required'),
  departmentId: z.string().min(1, 'Department is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  consultationType: z.enum(['new', 'follow_up']),
})

// ─── Consultation ────────────────────────────────────────
export const consultationSchema = z.object({
  chiefComplaint: z.string().min(1, 'Chief complaint is required'),
  symptoms: z.string().optional().or(z.literal('')),
  diagnosis: z.string().optional().or(z.literal('')),
  temperature: z.string().optional().or(z.literal('')),
  bloodPressure: z.string().optional().or(z.literal('')),
  pulse: z.string().optional().or(z.literal('')),
  respiratoryRate: z.string().optional().or(z.literal('')),
  oxygenSaturation: z.string().optional().or(z.literal('')),
  weight: z.string().optional().or(z.literal('')),
  height: z.string().optional().or(z.literal('')),
  clinicalNotes: z.string().optional().or(z.literal('')),
})

// ─── Prescription ────────────────────────────────────────
export const prescriptionItemSchema = z.object({
  medicineId: z.string().min(1, 'Medicine is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.string().min(1, 'Duration is required'),
  instructions: z.string().optional().or(z.literal('')),
})

export const prescriptionSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  consultationId: z.string().optional().or(z.literal('')),
  medicines: z.array(prescriptionItemSchema).min(1, 'At least one medicine required'),
})

// ─── Invoice / Billing ───────────────────────────────────
export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Price must be positive'),
  type: z.string().min(1, 'Type is required'),
})

export const invoiceSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  admissionId: z.string().optional().or(z.literal('')),
  appointmentId: z.string().optional().or(z.literal('')),
  type: z.enum(['OPD', 'IPD']),
  items: z.array(invoiceItemSchema).min(1, 'At least one item required'),
  tax: z.number().min(0).optional().default(0),
  discount: z.number().min(0).optional().default(0),
})

export const paymentSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  method: z.enum(['cash', 'card', 'upi', 'bank_transfer', 'insurance']),
  transactionId: z.string().optional().or(z.literal('')),
  receivedBy: z.string().optional().or(z.literal('')),
})

// ─── Medicine ────────────────────────────────────────────
export const medicineSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  genericName: z.string().optional().or(z.literal('')),
  manufacturer: z.string().optional().or(z.literal('')),
  category: z.string().optional().or(z.literal('')),
  stock: z.number().min(0, 'Stock cannot be negative'),
  unit: z.string().min(1, 'Unit is required'),
  price: z.number().min(0, 'Price must be positive'),
})

// ─── Service ─────────────────────────────────────────────
export const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  price: z.number().min(0, 'Price must be positive'),
  description: z.string().optional().or(z.literal('')),
})

// ─── Ward ────────────────────────────────────────────────
export const wardSchema = z.object({
  name: z.string().min(1, 'Ward name is required'),
  type: z.enum(['general', 'icu', 'emergency', 'private']),
  floor: z.number().min(1, 'Floor must be at least 1'),
})

// ─── Room ────────────────────────────────────────────────
export const roomSchema = z.object({
  wardId: z.string().min(1, 'Ward is required'),
  roomNumber: z.string().min(1, 'Room number is required'),
  type: z.enum(['general', 'private', 'semi_private']),
  bedCount: z.number().min(1, 'Must have at least 1 bed'),
  chargesPerDay: z.number().min(0, 'Charges must be positive'),
})

// ─── Admission ───────────────────────────────────────────
export const admissionSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  doctorId: z.string().min(1, 'Doctor is required'),
  wardId: z.string().min(1, 'Ward is required'),
  roomId: z.string().min(1, 'Room is required'),
  bedId: z.string().min(1, 'Bed is required'),
})

// ─── Daily Round ─────────────────────────────────────────
export const dailyRoundSchema = z.object({
  admissionId: z.string().min(1, 'Admission is required'),
  doctorId: z.string().min(1, 'Doctor is required'),
  temperature: z.string().optional().or(z.literal('')),
  bloodPressure: z.string().optional().or(z.literal('')),
  pulse: z.string().optional().or(z.literal('')),
  respiratoryRate: z.string().optional().or(z.literal('')),
  oxygenSaturation: z.string().optional().or(z.literal('')),
  notes: z.string().min(1, 'Notes are required'),
})

// ─── Lab Order ───────────────────────────────────────────
export const labOrderSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  consultationId: z.string().optional().or(z.literal('')),
  doctorId: z.string().min(1, 'Doctor is required'),
  testIds: z.array(z.string()).min(1, 'Select at least one test'),
})

// ─── Lab Test ────────────────────────────────────────────
export const labTestSchema = z.object({
  name: z.string().min(1, 'Test name is required'),
  category: z.string().min(1, 'Category is required'),
  price: z.number().min(0, 'Price must be positive'),
  description: z.string().optional().or(z.literal('')),
})

// ─── Lab Report ──────────────────────────────────────────
export const labReportSchema = z.object({
  results: z.string().min(1, 'Results are required'),
  uploadedBy: z.string().min(1, 'Uploaded by is required'),
})

// ─── User ────────────────────────────────────────────────
export const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  role: z.enum(['super_admin', 'hospital_admin', 'receptionist', 'doctor', 'nurse', 'lab_technician', 'pharmacist', 'billing_staff']),
  isActive: z.boolean().optional().default(true),
})

// ─── Department ──────────────────────────────────────────
export const departmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  description: z.string().optional().or(z.literal('')),
})

// ─── Doctor ──────────────────────────────────────────────
export const doctorCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  departmentId: z.string().min(1, 'Department is required'),
  specialization: z.string().min(1, 'Specialization is required'),
  qualification: z.string().optional().or(z.literal('')),
})

export const doctorUpdateSchema = z.object({
  specialization: z.string().min(1, 'Specialization is required'),
  qualification: z.string().optional().or(z.literal('')),
  available: z.boolean(),
})

// ─── Discharge ───────────────────────────────────────────
export const dischargeSchema = z.object({
  dischargeSummary: z.string().min(1, 'Discharge summary is required'),
  finalDiagnosis: z.string().min(1, 'Final diagnosis is required'),
  followUpDate: z.string().optional().or(z.literal('')),
})
