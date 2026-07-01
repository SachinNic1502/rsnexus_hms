import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { z } from "zod"

// ─── Auth Helper ─────────────────────────────────────────
export async function getAuthUser(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return null
  return { id: token.id as string, email: token.email as string, role: token.role as string }
}

export async function requireAuth(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), user: null }
  return { error: null, user }
}

export async function requireRole(request: NextRequest, roles: string[]) {
  const { error, user } = await requireAuth(request)
  if (error) return { error, user: null }
  if (!roles.includes(user.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), user: null }
  }
  return { error: null, user }
}

// ─── Validation Helper ───────────────────────────────────
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): { data: T | null; error: NextResponse | null } {
  const result = schema.safeParse(body)
  if (!result.success) {
    const messages = result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`)
    return { data: null, error: NextResponse.json({ error: "Validation failed", details: messages }, { status: 400 }) }
  }
  return { data: result.data, error: null }
}

// ─── Common Schemas ──────────────────────────────────────
export const idParamSchema = z.string().min(1, "Invalid ID")

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type PaginationParams = z.infer<typeof paginationSchema>

export function getPagination(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const result = paginationSchema.safeParse({
    page: searchParams.get("page") || 1,
    limit: searchParams.get("limit") || 20,
  })
  return result.success ? result.data : { page: 1, limit: 20 }
}

export function paginatedResponse(data: any[], total: number, page: number, limit: number) {
  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}
