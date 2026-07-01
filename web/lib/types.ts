// Common Prisma query builder types
export interface PatientWhereInput {
  uhid?: string | { contains?: string; mode?: 'insensitive' | 'default' }
  mobile?: string | { contains?: string }
  name?: string | { contains?: string; mode?: 'insensitive' | 'default' }
}

export interface AppointmentWhereInput {
  status?: 'scheduled' | 'waiting' | 'in_progress' | 'completed' | 'cancelled'
  date?: Date | { gte?: Date; lt?: Date; lte?: Date }
  doctorId?: string
  patientId?: string
}

export interface InvoiceWhereInput {
  status?: 'pending' | 'partial' | 'paid' | 'cancelled' | { in?: ('pending' | 'partial' | 'paid' | 'cancelled')[] }
  type?: 'OPD' | 'IPD'
  patientId?: string
}

export interface AdmissionWhereInput {
  status?: 'admitted' | 'discharged'
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
