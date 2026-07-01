# Rs Nexus HMS

A comprehensive Hospital Management System built with Next.js 16, Prisma, MongoDB, and NextAuth.

## Features

### Core Modules
- **Patient Registration** — UHID generation, demographics, medical history
- **Appointment Booking** — Doctor scheduling, time slot management, conflict detection
- **OPD (Outpatient)** — Consultation, vitals, prescriptions, auto-billing
- **IPD (Inpatient)** — Admission, daily rounds, discharge with auto-invoice
- **Billing** — Invoice generation, payment processing, receipts
- **Lab** — Test ordering, report上传, catalog management
- **Pharmacy** — Medicine inventory, stock management
- **Wards & Beds** — Ward/room/bed hierarchy, occupancy tracking

### Admin Features
- **User Management** — Role-based access (8 roles)
- **Department Management** — CRUD operations
- **Doctor Management** — Specialization, availability toggle
- **Service Catalog** — Pricing for billing
- **Reports** — Daily, monthly, revenue, bed occupancy, doctor performance

### Role-Based Access Control
| Role | Access |
|------|--------|
| `super_admin` | Full access |
| `hospital_admin` | All modules except user deletion |
| `receptionist` | Patient registration, appointments |
| `doctor` | OPD, IPD, prescriptions, lab orders |
| `nurse` | Wards, daily rounds, admissions |
| `lab_technician` | Lab orders, reports |
| `pharmacist` | Medicine inventory |
| `billing_staff` | Billing, payments |

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS, React Hook Form + Zod
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** MongoDB (Atlas or Local)
- **Auth:** NextAuth v4 with JWT strategy, bcryptjs password hashing

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
# Clone the repository
git clone https://github.com/SachinNic1502/rsnexus_hms.git
cd rsnexus_hms/web

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB connection string

# Seed the database
npx tsx prisma/seed.ts

# Start development server
npm run dev
```

### Environment Variables

```env
# MongoDB Connection
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/rsnexus_hms?appName=Cluster0"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### Default Login

After seeding, login with:
- **Email:** admin@rsnexus.com
- **Password:** password

## Project Structure

```
rsnexus_hms/
├── docs/
│   └── project_prd.md
└── web/
    ├── app/
    │   ├── api/           # API routes
    │   ├── appointments/  # Appointment booking
    │   ├── billing/       # Invoice & payments
    │   ├── dashboard/     # Dashboard
    │   ├── ipd/           # Inpatient department
    │   ├── lab/           # Lab orders & reports
    │   ├── medicines/     # Pharmacy
    │   ├── opd/           # Outpatient department
    │   ├── patients/      # Patient registration
    │   ├── prescriptions/ # Prescription view
    │   ├── reports/       # Analytics reports
    │   ├── services/      # Service catalog
    │   ├── settings/      # Admin settings
    │   └── wards/         # Ward management
    ├── components/        # Reusable UI components
    ├── lib/               # Utilities, auth, validations
    ├── prisma/            # Schema, seed, migrations
    └── types/             # TypeScript types
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/[...nextauth]` | POST | NextAuth authentication |
| `/api/patients` | GET/POST | List/create patients |
| `/api/appointments` | GET/POST | List/create appointments |
| `/api/consultations` | GET/POST | Create consultations |
| `/api/prescriptions` | GET/POST | Create prescriptions |
| `/api/invoices` | GET/POST | List/create invoices |
| `/api/invoices/auto-opd` | POST | Auto-generate OPD invoice |
| `/api/invoices/auto-ipd` | POST | Auto-generate IPD invoice |
| `/api/admissions` | GET/POST | IPD admissions |
| `/api/daily-rounds` | POST | Record daily rounds |
| `/api/lab-orders` | GET/POST | Lab test orders |
| `/api/users` | GET/POST | User management |
| `/api/departments` | GET/POST | Department management |
| `/api/medicines` | GET/POST | Medicine catalog |
| `/api/services` | GET/POST | Service catalog |
| `/api/reports` | GET | Analytics data |

## Database Schema

Key models:
- `User` — Staff accounts with roles
- `Patient` — Patient demographics
- `Doctor` — Doctor profiles linked to users
- `Appointment` — Scheduled visits
- `Consultation` — OPD consultations with vitals
- `Prescription` — Medications prescribed
- `Admission` — IPD admissions
- `DailyRound` — Inpatient daily notes
- `Invoice` — Billing records
- `LabOrder` — Lab test orders
- `Ward` / `Room` / `Bed` — Facility hierarchy

## License

MIT
