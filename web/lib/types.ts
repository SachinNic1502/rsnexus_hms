// Common Prisma query builder types
export interface PatientWhereInput {
  uhid?: string | { contains?: string; mode?: 'insensitive' | 'default' }
  mobile?: string | { contains?: string }
  name?: string | { contains?: string; mode?: 'insensitive' | 'default' }
  isDeleted?: { not?: boolean; isSet?: boolean } | boolean
  OR?: PatientWhereInput[]
  AND?: PatientWhereInput[]
  // Relational scoping used to restrict a patient list/detail lookup to
  // patients linked to a given doctor (via appointment, admission, or
  // consultation) — Patient has no direct doctorId column.
  appointments?: { some: { doctorId: string } }
  admissions?: { some: { doctorId: string } }
  consultations?: { some: { doctorId: string } }
}

export interface AppointmentWhereInput {
  status?: 'scheduled' | 'waiting' | 'in_progress' | 'completed' | 'cancelled' | { in: ('scheduled' | 'waiting' | 'in_progress' | 'completed' | 'cancelled')[] }
  date?: Date | { gte?: Date; lt?: Date; lte?: Date }
  doctorId?: string
  patientId?: string
  isDeleted?: { not?: boolean; isSet?: boolean } | boolean
  OR?: AppointmentWhereInput[]
}

export interface InvoiceWhereInput {
  status?: 'pending' | 'partial' | 'paid' | 'cancelled' | { in?: ('pending' | 'partial' | 'paid' | 'cancelled')[] }
  type?: 'OPD' | 'IPD'
  patientId?: string
}

export interface AdmissionWhereInput {
  status?: 'admitted' | 'discharged'
  doctorId?: string
}

// Common types for API responses
export interface ApiResponse<T> {
  data?: T
  error?: string
  context?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
