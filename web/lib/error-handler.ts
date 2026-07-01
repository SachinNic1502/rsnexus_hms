import { NextResponse } from 'next/server'
import { logger } from './logger'

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public context?: string,
    public metadata?: Record<string, any>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function handleApiError(error: unknown, context: string = 'API') {
  if (error instanceof ApiError) {
    logger.error(error.message, context, error.metadata)
    return NextResponse.json(
      { error: error.message, context: error.context },
      { status: error.statusCode }
    )
  }

  if (error instanceof Error) {
    logger.error(error.message, context, { stack: error.stack })
    return NextResponse.json(
      { error: 'Internal server error', context },
      { status: 500 }
    )
  }

  logger.error('Unknown error occurred', context, { error })
  return NextResponse.json(
    { error: 'Internal server error', context },
    { status: 500 }
  )
}
