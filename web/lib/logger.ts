type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: string
  metadata?: Record<string, any>
}

class Logger {
  private formatLog(entry: LogEntry): string {
    const { level, message, timestamp, context, metadata } = entry
    const contextStr = context ? `[${context}]` : ''
    const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : ''
    return `[${timestamp}] ${level.toUpperCase()} ${contextStr} ${message}${metadataStr}`
  }

  private log(level: LogLevel, message: string, context?: string, metadata?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      metadata,
    }
    
    const formattedLog = this.formatLog(entry)
    
    switch (level) {
      case 'error':
        console.error(formattedLog)
        break
      case 'warn':
        console.warn(formattedLog)
        break
      case 'debug':
        console.debug(formattedLog)
        break
      default:
        console.log(formattedLog)
    }
  }

  info(message: string, context?: string, metadata?: Record<string, any>) {
    this.log('info', message, context, metadata)
  }

  warn(message: string, context?: string, metadata?: Record<string, any>) {
    this.log('warn', message, context, metadata)
  }

  error(message: string, context?: string, metadata?: Record<string, any>) {
    this.log('error', message, context, metadata)
  }

  debug(message: string, context?: string, metadata?: Record<string, any>) {
    this.log('debug', message, context, metadata)
  }
}

export const logger = new Logger()
