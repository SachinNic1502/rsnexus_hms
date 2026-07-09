import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { rateLimitMiddleware } from "@/lib/rate-limiter"

const adminOnlyRoutes = [
  "/api/users",
  "/api/wards",
  "/api/beds",
  "/api/medicines",
  "/api/lab-tests",
  "/api/rooms",
  "/api/departments",
  "/api/services",
]

const doctorNurseRoutes = [
  "/api/consultations",
  "/api/daily-rounds",
]

const prescriptionRoutes = [
  "/api/prescriptions",
]

const nurseRoutes = [
  "/api/admissions",
]

const labRoutes = [
  "/api/lab-orders",
]

const billingOnlyRoutes = [
  "/api/invoices",
]

const reportsOnlyRoutes = [
  "/api/reports",
]

const receptionistRoutes = [
  "/api/appointments",
]

const opdRoutes = [
  "/api/opd",
]

function getRouteRole(pathname: string): string | null {
  if (pathname.startsWith("/api/invoices/auto-opd") || pathname.startsWith("/api/invoices/auto-ipd")) {
    return "billing_auto"
  }
  if (pathname.startsWith("/api/invoices") && pathname.includes("/payment")) {
    return "billing"
  }
  
  for (const route of adminOnlyRoutes) {
    if (pathname.startsWith(route)) return "admin"
  }
  for (const route of doctorNurseRoutes) {
    if (pathname.startsWith(route)) return "doctor_nurse"
  }
  for (const route of prescriptionRoutes) {
    if (pathname.startsWith(route)) return "doctor_pharmacist"
  }
  for (const route of nurseRoutes) {
    if (pathname.startsWith(route)) return "nurse"
  }
  for (const route of labRoutes) {
    if (pathname.startsWith(route)) return "lab"
  }
  for (const route of billingOnlyRoutes) {
    if (pathname.startsWith(route)) return "billing"
  }
  for (const route of reportsOnlyRoutes) {
    if (pathname.startsWith(route)) return "reports"
  }
  for (const route of receptionistRoutes) {
    if (pathname.startsWith(route)) return "receptionist"
  }
  for (const route of opdRoutes) {
    if (pathname.startsWith(route)) return "opd"
  }
  return null
}

const adminRoles = ["super_admin", "hospital_admin"]
const doctorNurseRoles = ["super_admin", "hospital_admin", "doctor", "nurse"]
const doctorPharmacistRoles = ["super_admin", "hospital_admin", "doctor", "pharmacist"]
const nurseRoles = ["super_admin", "hospital_admin", "nurse", "doctor"]
const labRoles = ["super_admin", "hospital_admin", "doctor", "lab_technician"]
const billingRoles = ["super_admin", "hospital_admin", "billing_staff", "receptionist", "nurse"]
const billingAutoRoles = ["super_admin", "hospital_admin", "billing_staff", "receptionist", "nurse", "doctor"]
const reportsRoles = ["super_admin", "hospital_admin"]
const receptionistRoles = ["super_admin", "hospital_admin", "receptionist", "doctor", "nurse"]
const opdRoles = ["super_admin", "hospital_admin", "doctor", "nurse", "receptionist", "billing_staff"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/"
  ) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/api/")) {
    // Apply rate limiting to all API routes
    const rateLimitResponse = rateLimitMiddleware(request, 100, 60000) // 100 requests per minute
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Allow any authenticated staff to GET master data catalogs
    const isMasterDataGet = request.method === "GET" && (
      pathname.startsWith("/api/departments") ||
      pathname.startsWith("/api/wards") ||
      pathname.startsWith("/api/beds") ||
      pathname.startsWith("/api/medicines") ||
      pathname.startsWith("/api/lab-tests") ||
      pathname.startsWith("/api/rooms") ||
      pathname.startsWith("/api/services")
    )

    if (isMasterDataGet) {
      return NextResponse.next()
    }

    const requiredRole = getRouteRole(pathname)
    if (requiredRole) {
      const userRole = token.role as string
      let allowed = false
      if (requiredRole === "admin") allowed = adminRoles.includes(userRole)
      else if (requiredRole === "doctor_nurse") allowed = doctorNurseRoles.includes(userRole)
      else if (requiredRole === "doctor_pharmacist") allowed = doctorPharmacistRoles.includes(userRole)
      else if (requiredRole === "nurse") allowed = nurseRoles.includes(userRole)
      else if (requiredRole === "lab") allowed = labRoles.includes(userRole)
      else if (requiredRole === "billing") allowed = billingRoles.includes(userRole)
      else if (requiredRole === "billing_auto") allowed = billingAutoRoles.includes(userRole)
      else if (requiredRole === "reports") allowed = reportsRoles.includes(userRole)
      else if (requiredRole === "receptionist") allowed = receptionistRoles.includes(userRole)
      else if (requiredRole === "opd") allowed = opdRoles.includes(userRole)
      
      if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    return NextResponse.next()
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token && pathname !== "/login") {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}

