# Pravah MediCloud HMS - Development Plan

## Project Overview
Hospital Management System built with Next.js, TypeScript, and Tailwind CSS following the PRD specifications.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 6
- **Styling**: Tailwind CSS 3.4
- **UI Components**: shadcn/ui (manual installation)
- **Icons**: Lucide React
- **State Management**: React Context + NextAuth.js
- **Database**: PostgreSQL 18 (Prisma ORM 7.8)
- **Authentication**: NextAuth.js 4 (JWT strategy, CredentialsProvider)
- **Forms**: React Hook Form 7.80 + Zod 4.4.3 + @hookform/resolvers
- **Database Adapter**: @prisma/adapter-pg
- **Exports**: xlsx (Excel), jsPDF + jspdf-autotable (PDF)
- **UI Utilities**: Toast notifications, Confirm dialogs, Error boundaries, Skeletons

---

## Current Status Summary

### ✅ Completed Features (52 pages, 37 API routes, all using real PostgreSQL data)

**Auth & Layout**
- Landing page with "Get Started" CTA
- Login page with real NextAuth.js authentication
- Auth context with JWT session and role-based access
- Sidebar navigation with role display and logout
- **Responsive mobile layout** with hamburger menu (<lg breakpoint)
- Protected layouts for all authenticated routes
- API route protection middleware
- Error boundary wrapping all dashboard content
- Toast notification system (success/error/warning/info)
- Confirm dialog for destructive actions

**Dashboard**
- Dashboard with REAL data (appointments, admissions, beds, bills, doctors)

**Patient Management**
- Patient list with REAL API search (UHID, mobile, name)
- Patient registration form connected to `POST /api/patients`
- Patient profile view with real consultations, prescriptions, lab orders
- Patient edit page connected to `PUT /api/patients/[id]`
- Zod validation on registration form

**Appointment System**
- Appointment list with REAL API and status filters
- Appointment booking form with real dept/doctor/patient lookup
- Appointment calendar view - weekly calendar with appointment blocks, doctor filter

**OPD Workflow**
- OPD patient queue showing real today's appointments
- Doctor consultation interface saving to database
- Prescription form saving to database via API

**IPD Workflow**
- IPD admissions list with real data
- IPD admission form with real ward/room/bed lookup
- Admission detail page (daily rounds, invoices, patient info)
- Daily rounds UI (vitals recording + clinical notes)
- Discharge process UI (summary, diagnosis, follow-up date, auto invoice)

**Ward & Bed Management**
- Ward management page - create/edit/delete wards, expandable room/bed grid
- Room/bed creation (room type, charges/day, auto-create beds)
- Bed management dashboard - real-time bed status, occupancy by ward, bed grid

**Lab Module**
- Lab orders list with real data
- Lab test ordering with real test catalog
- Lab test catalog management (add/view tests)
- Lab report upload saving results to database
- Lab module in sidebar navigation

**Billing**
- Billing invoice list with real data
- Invoice generation with real service catalog and patient lookup
- Payment processing API (records payments, updates invoice status)
- Payment processing UI (method selection, amount split, transaction ID)
- Pending payment tracking (unpaid/partial invoices, overdue badges)
- Receipt printing (printable receipt with hospital header)
- Automatic IPD invoice on discharge (room charges calculated)

**Medicines & Services**
- Medicine management (CRUD with search, low stock badges, category filter)
- Service management (CRUD with category, pricing, grid view)

**Reports & Analytics**
- Reports landing page with navigation cards
- Daily report - appointments, admissions, discharges, revenue summary
- Monthly report - department breakdown, revenue by type (OPD/IPD)
- Revenue report - category, payment method, daily trend, top patients
- Doctor performance report - appointments, consultations, completion rates
- Bed occupancy report - ward-wise beds, admitted patients list
- Export to Excel (xlsx) and PDF (jsPDF + autoTable) for all reports

**Settings & Administration**
- Settings landing page with navigation cards
- User management (CRUD with role assignment, active/inactive)
- Department management (CRUD with doctor count)
- Doctor management (availability toggle, specialization edit)

**Prescription**
- Prescription form saving to database
- Prescription preview/print page (print-ready with hospital header)

**UI Components**
- Toast notifications (`components/ui/toast.tsx`) - success/error/warning/info
- Confirm dialog (`components/ui/dialog.tsx`) - destructive action confirmation
- Error boundary (`components/ui/error-boundary.tsx`) - catches render errors with retry
- Loading skeletons (`components/ui/skeleton.tsx`) - 6 reusable skeleton variants
- Responsive sidebar (`components/sidebar.tsx`) - mobile hamburger menu

**Infrastructure**
- Prisma schema with 22+ models, fully migrated
- Database seeded with realistic data
- 37 API routes all fully implemented with real Prisma queries
- TypeScript types for all entities
- Export utility library (`lib/export-utils.ts`)
- Zod validation schemas (`lib/validations.ts`)

---

## Phase 1: Project Setup ✅ COMPLETE
- [x] Create development plan
- [x] Initialize Next.js project with TypeScript
- [x] Configure Tailwind CSS
- [x] Install and configure shadcn/ui (button, input, card, badge)
- [x] Set up project folder structure
- [x] Configure Prisma with PostgreSQL
- [x] Set up NextAuth.js authentication (JWT + CredentialsProvider)
- [x] Create base layout and navigation
- [x] Install dependencies: @prisma/adapter-pg, @auth/prisma-adapter, bcryptjs, react-hook-form, zod, xlsx, jspdf, jspdf-autotable

---

## Phase 2: Core Infrastructure ✅ COMPLETE
- [x] Define database schema (22+ models in prisma/schema.prisma)
- [x] Create Prisma models and migrations (init migration applied)
- [x] Set up API routes structure (37 API routes)
- [x] Create authentication pages (login)
- [x] Implement real RBAC (NextAuth JWT with role, hasRole() in context)
- [x] Create reusable UI components (button, input, card, badge)
- [x] Add middleware for API protection (middleware.ts)

---

## Phase 3: Dashboard & Navigation ✅ COMPLETE
- [x] Build main navigation sidebar
- [x] Create Dashboard with REAL data (all stats from API)
- [x] Implement responsive layout (mobile hamburger menu)

---

## Phase 4: Patient Management ✅ COMPLETE
- [x] Patient Registration page connected to `POST /api/patients`
- [x] Patient search functionality (UHID, mobile, name)
- [x] Patient profile view fetching from `GET /api/patients/[id]`
- [x] Medical records view (consultations, prescriptions, lab orders from API)
- [x] Patient list with filters
- [x] Patient edit page connected to `PUT /api/patients/[id]`

---

## Phase 5: Appointment System ✅ COMPLETE
- [x] Book Appointment page connected to `POST /api/appointments`
- [x] Department selection (fetched from `GET /api/departments`)
- [x] Doctor selection (fetched from `GET /api/doctors` filtered by department)
- [x] Patient search (fetched from `GET /api/patients` by UHID)
- [x] Date and time picker
- [x] Consultation type (new/follow-up)
- [x] Generate appointment number and token (auto-generated by API)
- [x] Appointment calendar view (weekly grid, doctor filter)

---

## Phase 6: OPD Workflow ✅ COMPLETE
- [x] Patient Check-In (updates status via `PUT /api/appointments/[id]`)
- [x] Doctor Queue management (real today's appointments from API)
- [x] Doctor Consultation interface (saves to `POST /api/consultations`)
- [x] Medical history view
- [x] Chief complaint recording
- [x] Symptoms and diagnosis recording
- [x] Vitals recording (temperature, BP, pulse, resp rate, SpO2, weight, height)
- [x] Clinical notes
- [x] Auto-updates appointment status to in_progress and completed

---

## Phase 7: Prescription Module ✅ COMPLETE
- [x] Medicine selection and dosing
- [x] Frequency and duration inputs
- [x] Special instructions
- [x] Prescription saving connected to `POST /api/prescriptions` with medicine items
- [x] Prescription preview/print page (`/prescriptions/[id]`)

---

## Phase 8: Lab Integration ✅ COMPLETE
- [x] Lab test ordering connected to `POST /api/lab-orders`
- [x] Test catalog management connected to `GET/POST /api/lab-tests`
- [x] Lab report upload connected to `POST /api/lab-orders/[id]/report`
- [x] Report viewing for doctors (fetches from API)
- [x] Auto-completes lab order when report is uploaded
- [x] Add Lab to sidebar navigation

---

## Phase 9: IPD Admission ✅ COMPLETE
- [x] Admission form connected to `POST /api/admissions`
- [x] Ward selection (fetched from `GET /api/wards` with bed stats)
- [x] Room and bed assignment (dynamic based on ward selection)
- [x] Generate admission number (auto-generated by API)
- [x] Bed status auto-update (marks bed as occupied on admission)
- [x] Ward management page (CRUD, expandable room/bed grid)
- [x] Bed management dashboard (real-time bed status, occupancy stats)
- [x] Admission detail page (`/ipd/[id]` - daily rounds, invoices, patient info)

---

## Phase 10: IPD Daily Operations ✅ COMPLETE
- [x] Daily rounds API (`GET/POST /api/daily-rounds`)
- [x] Daily rounds UI page (`/ipd/[id]/daily-rounds`) - vitals form + clinical notes
- [x] Discharge process UI (`/ipd/[id]/discharge`) - summary, diagnosis, follow-up
- [x] Automatic IPD invoice generation on discharge

---

## Phase 11: Billing System ✅ COMPLETE
- [x] OPD billing generation connected to `POST /api/invoices`
- [x] Service charges management (fetched from `GET /api/services`)
- [x] Invoice generation with line items, tax, discount
- [x] Payment processing API (`POST /api/invoices/[id]/payment`)
- [x] Auto-updates invoice status (pending → partial → paid)
- [x] Payment processing UI page (`/billing/[id]/payment`)
- [x] Receipt printing (`/billing/[id]/receipt`)
- [x] Pending payment tracking (`/billing/pending`)
- [x] Automatic IPD invoice generation on discharge

---

## Phase 12: Discharge Process ✅ COMPLETE
- [x] Discharge API (`PUT /api/admissions/[id]` with discharge data)
- [x] Bed auto-freed on discharge (transaction updates bed status)
- [x] Discharge process UI page with summary form
- [x] Final diagnosis recording
- [x] Follow-up scheduling
- [x] Auto IPD invoice generation with room charges

---

## Phase 13: Reports & Analytics ✅ COMPLETE
- [x] Reports landing page with navigation cards
- [x] Daily report - appointments, admissions, discharges, revenue summary
- [x] Monthly report - department breakdown, revenue by type (OPD/IPD)
- [x] Revenue report - category, payment method, daily trend, top patients
- [x] Doctor performance report - appointments, consultations, completion rates
- [x] Bed occupancy report - ward-wise beds, admitted patients list
- [x] Export to Excel (xlsx) for all reports
- [x] Export to PDF (jsPDF + autoTable) for all reports
- [x] Report API (`GET /api/reports?type=daily|monthly|revenue|doctor-performance|bed-occupancy`)

---

## Phase 14: Settings & Administration ✅ COMPLETE
- [x] Settings page (`/settings`) with navigation cards
- [x] User management (CRUD with role assignment, active/inactive)
- [x] Department management (CRUD with doctor count)
- [x] Doctor management (availability toggle, specialization edit)
- [x] Medicine management (`/medicines` - CRUD with search, low stock)
- [x] Service management (`/services` - CRUD with category, pricing)

---

## Phase 15: UI Polish & Components ✅ COMPLETE
- [x] Patient edit page (`/patients/[id]/edit`)
- [x] Room/bed management UI (add rooms/beds to wards)
- [x] Medicine management page (`/medicines`)
- [x] Service management page (`/services`)
- [x] Add Lab module to sidebar navigation
- [x] Form validation with Zod + React Hook Form on patient registration
- [x] Prescription print/preview functionality (`/prescriptions/[id]`)
- [x] Responsive mobile layout (sidebar hamburger menu)
- [x] Toast notifications (replaced all `alert()`)
- [x] Error boundary components (wraps dashboard content)
- [x] Loading skeleton states (6 reusable skeleton variants)
- [x] Confirmation dialogs on destructive actions

---

## Phase 16: Testing & Deployment ❌ NOT STARTED
- [ ] Unit testing
- [ ] Integration testing
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Deployment preparation
- [ ] Production deployment

---

## Database Schema ✅ FULLY DEFINED

### Prisma Models (22+ models, fully migrated)
- **User** - authentication, roles (8 role enum)
- **Patient** - patient profiles, UHID (unique)
- **Department** - hospital departments
- **Doctor** - doctor profiles, linked to User and Department
- **Appointment** - OPD appointments with status tracking
- **Consultation** - doctor consultations with vitals
- **Medicine** - medicine catalog with stock
- **Prescription** - prescription header
- **PrescriptionMedicine** - prescription line items
- **LabTest** - lab test catalog
- **LabOrder** - lab test orders
- **LabOrderTest** - lab order line items
- **LabReport** - lab results (JSON)
- **Ward** - ward information (general, icu, emergency, private)
- **Room** - room information (general, private, semi_private)
- **Bed** - bed management (available, occupied, maintenance)
- **Admission** - IPD admissions with discharge support
- **DailyRound** - IPD daily rounds/vitals
- **Invoice** - billing invoices (OPD/IPD)
- **InvoiceItem** - invoice line items
- **Payment** - payment records (cash, card, upi, bank_transfer, insurance)
- **Service** - service catalog

---

## API Routes ✅ ALL 37 ROUTES IMPLEMENTED

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth.js handler |
| `/api/dashboard` | GET | Dashboard stats |
| `/api/patients` | GET, POST | List/search/create patients |
| `/api/patients/[id]` | GET, PUT | Get/update patient |
| `/api/departments` | GET, POST | List/create departments |
| `/api/departments/[id]` | GET, PUT | Get/update department |
| `/api/doctors` | GET | List doctors |
| `/api/doctors/[id]` | GET, PUT | Get/update doctor |
| `/api/appointments` | GET, POST | List/create appointments |
| `/api/appointments/[id]` | GET, PUT | Get/update appointment |
| `/api/consultations` | GET, POST | List/create consultations |
| `/api/consultations/[id]` | GET, PUT | Get/update consultation |
| `/api/medicines` | GET, POST | List/create medicines |
| `/api/medicines/[id]` | GET, PUT, DELETE | Get/update/delete medicine |
| `/api/prescriptions` | GET, POST | List/create prescriptions |
| `/api/prescriptions/[id]` | GET | Get prescription |
| `/api/lab-tests` | GET, POST | List/create lab tests |
| `/api/lab-orders` | GET, POST | List/create lab orders |
| `/api/lab-orders/[id]` | GET, PUT | Get/update lab order |
| `/api/lab-orders/[id]/report` | GET, POST | Get/upload lab report |
| `/api/admissions` | GET, POST | List/create admissions |
| `/api/admissions/[id]` | GET, PUT | Get/discharge admission (auto IPD invoice) |
| `/api/daily-rounds` | GET, POST | List/create daily rounds |
| `/api/wards` | GET, POST | List/create wards with bed stats |
| `/api/wards/[id]` | GET, PUT, DELETE | Get/update/delete ward |
| `/api/rooms` | POST | Create room (auto-creates beds) |
| `/api/beds` | GET | List beds (filter by ward/status) |
| `/api/beds/[id]` | DELETE | Delete bed (if not occupied) |
| `/api/services` | GET, POST | List/create services |
| `/api/services/[id]` | GET, PUT, DELETE | Get/update/delete service |
| `/api/users` | GET, POST | List/create users |
| `/api/users/[id]` | PUT, DELETE | Update/delete user |
| `/api/invoices` | GET, POST | List/create invoices |
| `/api/invoices/[id]` | GET, PUT | Get/update invoice |
| `/api/invoices/[id]/payment` | POST | Process payment |
| `/api/reports` | GET | Generate 5 report types |

---

## Pages Inventory (52 pages)

| Page | Path | Data Source |
|------|------|-------------|
| Home/Landing | `/` | Static (redirects if authed) |
| Login | `/login` | NextAuth signIn() |
| Dashboard | `/dashboard` | `GET /api/dashboard` |
| Patient List | `/patients` | `GET /api/patients` |
| New Patient | `/patients/new` | `POST /api/patients` |
| Patient Profile | `/patients/[id]` | `GET /api/patients/[id]` |
| Edit Patient | `/patients/[id]/edit` | `PUT /api/patients/[id]` |
| Appointment List | `/appointments` | `GET /api/appointments` |
| Book Appointment | `/appointments/new` | `POST /api/appointments` |
| Calendar View | `/appointments/calendar` | `GET /api/appointments` |
| OPD Queue | `/opd` | `GET /api/appointments` |
| Consultation | `/opd/consultation/[id]` | `POST /api/consultations` |
| IPD Admissions | `/ipd` | `GET /api/admissions` |
| Admission Detail | `/ipd/[id]` | `GET /api/admissions/[id]` |
| Daily Rounds | `/ipd/[id]/daily-rounds` | `POST /api/daily-rounds` |
| Discharge | `/ipd/[id]/discharge` | `PUT /api/admissions/[id]` |
| New Admission | `/ipd/admit` | `POST /api/admissions` |
| Ward Management | `/wards` | `GET/POST/PUT/DELETE /api/wards` |
| Bed Dashboard | `/wards/beds` | `GET /api/beds`, `GET /api/wards` |
| Invoice List | `/billing` | `GET /api/invoices` |
| New Invoice | `/billing/new` | `POST /api/invoices` |
| Pending Payments | `/billing/pending` | `GET /api/invoices?status=pending\|partial` |
| Process Payment | `/billing/[id]/payment` | `POST /api/invoices/[id]/payment` |
| Receipt | `/billing/[id]/receipt` | `GET /api/invoices/[id]` |
| Prescription Print | `/prescriptions/[id]` | `GET /api/prescriptions/[id]` |
| Lab Orders | `/lab` | `GET /api/lab-orders` |
| New Lab Order | `/lab/order` | `POST /api/lab-orders` |
| Lab Order Detail | `/lab/order/[id]` | `GET/POST /api/lab-orders/[id]` |
| Lab Catalog | `/lab/catalog` | `GET/POST /api/lab-tests` |
| Medicines | `/medicines` | `GET/POST/PUT/DELETE /api/medicines` |
| Services | `/services` | `GET/POST/PUT/DELETE /api/services` |
| Settings Landing | `/settings` | Static navigation |
| User Management | `/settings/users` | `GET/POST/PUT/DELETE /api/users` |
| Departments | `/settings/departments` | `GET/POST/PUT /api/departments` |
| Doctor Management | `/settings/doctors` | `GET/PUT /api/doctors` |
| Reports Landing | `/reports` | Static navigation |
| Daily Report | `/reports/daily` | `GET /api/reports?type=daily` |
| Monthly Report | `/reports/monthly` | `GET /api/reports?type=monthly` |
| Revenue Report | `/reports/revenue` | `GET /api/reports?type=revenue` |
| Doctor Performance | `/reports/doctor-performance` | `GET /api/reports?type=doctor-performance` |
| Bed Occupancy | `/reports/bed-occupancy` | `GET /api/reports?type=bed-occupancy` |

---

## User Roles
1. **Super Admin** - Full system access
2. **Hospital Admin** - Hospital-level management
3. **Receptionist** - Patient registration, appointments, billing
4. **Doctor** - Consultations, prescriptions, admissions
5. **Nurse** - Patient care, vitals, medication
6. **Lab Technician** - Lab reports
7. **Pharmacist** - Medicine dispensing
8. **Billing Staff** - Invoice generation

### Seed Users
| Email | Role | Password |
|-------|------|----------|
| admin@hospital.com | Super Admin | password |
| reception@hospital.com | Receptionist | password |
| doctor@hospital.com | Doctor | password |
| nurse@hospital.com | Nurse | password |
| lab@hospital.com | Lab Technician | password |
| billing@hospital.com | Billing Staff | password |
| dr.sarah@hospital.com | Doctor | password |
| dr.michael@hospital.com | Doctor | password |
| dr.emily@hospital.com | Doctor | password |
| dr.robert@hospital.com | Doctor | password |

---

## Priority Action Items

### 🔴 Critical - ALL COMPLETED ✅
1. ~~Set up Prisma + PostgreSQL database~~ ✅
2. ~~Create database schema and migrations~~ ✅
3. ~~Build API routes for all modules~~ ✅ (37 routes)
4. ~~Integrate NextAuth.js for real authentication~~ ✅
5. ~~Connect frontend to real backend data~~ ✅ (52 pages, all real data)
6. ~~Build all 5 report types with real data~~ ✅
7. ~~Add export functionality (PDF/Excel)~~ ✅
8. ~~Build ward/bed management UI~~ ✅
9. ~~Patient edit page~~ ✅
10. ~~Prescription preview/print~~ ✅
11. ~~Payment processing UI~~ ✅
12. ~~Pending payment tracking~~ ✅
13. ~~Receipt printing~~ ✅
14. ~~Lab in sidebar navigation~~ ✅
15. ~~Automatic IPD invoice on discharge~~ ✅
16. ~~Settings & Administration~~ ✅ (Users, Departments, Doctors)
17. ~~IPD daily rounds UI~~ ✅
18. ~~Discharge process UI~~ ✅
19. ~~Doctor schedule management~~ ✅
20. ~~Responsive mobile layout~~ ✅ (hamburger menu)
21. ~~Error boundary components~~ ✅
22. ~~Loading skeleton states~~ ✅ (6 variants)
23. ~~Toast notifications~~ ✅
24. ~~Confirm dialogs~~ ✅

### 🔵 Remaining
25. Unit/integration/E2E tests
26. Performance optimization
27. Security audit
28. Deployment preparation

---

## Milestones

### Milestone 1 ✅ COMPLETE
Database + API + Auth + Frontend + Reports + Export + Wards/Beds + Billing UI

### Milestone 2 ✅ COMPLETE
Settings/Admin + IPD Operations + Discharge + Doctor Schedule + Form Validation + UI Components + Responsive + Error Handling

### Milestone 3 (Next)
Testing + Security audit + Performance + Production deployment

---

## Success Criteria
- [x] All PRD workflows implemented with real data (core workflows)
- [x] Role-based access control working (middleware + JWT)
- [x] Responsive design for all screen sizes
- [ ] Data validation with Zod on all forms (only patient registration done)
- [ ] Performance < 2s for page loads
- [ ] Security best practices implemented
- [ ] Production-ready deployment

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 18 running on localhost:5432
- Database: `pravah_medicloud`

### Setup
```bash
cd web
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### Login
- URL: http://localhost:3000/login
- Email: admin@hospital.com
- Password: password
