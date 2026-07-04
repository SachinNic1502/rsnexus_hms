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

const doctorOnlyRoutes = [
  "/api/consultations",
  "/api/prescriptions",
  "/api/daily-rounds",
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

function getRouteRole(pathname: string): string | null {
  for (const route of adminOnlyRoutes) {
    if (pathname.startsWith(route)) return "admin"
  }
  for (const route of doctorOnlyRoutes) {
    if (pathname.startsWith(route)) return "doctor"
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
  if (pathname.startsWith("/api/invoices/auto-opd") || pathname.startsWith("/api/invoices/auto-ipd")) return "billing"
  if (pathname.startsWith("/api/invoices") && pathname.includes("/payment")) return "billing"
  return null
}

const adminRoles = ["super_admin", "hospital_admin"]
const doctorRoles = ["doctor"]
const nurseRoles = ["super_admin", "hospital_admin", "nurse"]
const labRoles = ["super_admin", "hospital_admin", "doctor", "lab_technician"]
const billingRoles = ["super_admin", "hospital_admin", "billing_staff", "receptionist"]
const reportsRoles = ["super_admin", "hospital_admin"]
const receptionistRoles = ["super_admin", "hospital_admin", "receptionist"]

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

    const requiredRole = getRouteRole(pathname)
    if (requiredRole) {
      const userRole = token.role as string
      let allowed = false
      if (requiredRole === "admin") allowed = adminRoles.includes(userRole)
      else if (requiredRole === "doctor") allowed = doctorRoles.includes(userRole)
      else if (requiredRole === "nurse") allowed = nurseRoles.includes(userRole)
      else if (requiredRole === "lab") allowed = labRoles.includes(userRole)
      else if (requiredRole === "billing") allowed = billingRoles.includes(userRole)
      else if (requiredRole === "reports") allowed = reportsRoles.includes(userRole)
      else if (requiredRole === "receptionist") allowed = receptionistRoles.includes(userRole)
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
