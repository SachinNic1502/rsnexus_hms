'use client'

import { useEffect, useRef } from 'react'

export default function ApiDocs() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load CSS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui.css'
    document.head.appendChild(link)

    // Load JS
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js'
    script.async = true
    script.onload = () => {
      // @ts-ignore
      if (window.SwaggerUIBundle) {
        // @ts-ignore
        window.SwaggerUIBundle({
          url: '/swagger.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            // @ts-ignore
            window.SwaggerUIBundle.presets.apis,
            // @ts-ignore
            window.SwaggerUIBundle.SwaggerUIStandalonePreset
          ],
        })
      }
    }
    document.body.appendChild(script)

    return () => {
      try {
        document.head.removeChild(link)
      } catch (e) {
        // Ignore if already removed
      }
      try {
        document.body.removeChild(script)
      } catch (e) {
        // Ignore if already removed
      }
    }
  }, [])

  return (
    <div className="bg-white min-h-screen">
      <div id="swagger-ui" ref={containerRef} />
    </div>
  )
}
