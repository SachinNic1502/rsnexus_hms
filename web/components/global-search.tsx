"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, User, Phone, Clipboard } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Local debouncing implementation
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    return () => clearTimeout(handler)
  }, [query])

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    const searchPatients = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/patients?search=${encodeURIComponent(debouncedQuery)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(Array.isArray(data) ? data.slice(0, 5) : [])
          setIsOpen(true)
        }
      } catch (err) {
        console.error('Global search error:', err)
      } finally {
        setLoading(false)
      }
    }

    searchPatients()
  }, [debouncedQuery])

  const handleSelect = (patientId: string) => {
    setQuery('')
    setIsOpen(false)
    router.push(`/patients/${patientId}`)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search patients by name, UHID, or mobile..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-9 bg-slate-50 border-slate-200 focus:bg-white text-sm"
          onFocus={() => {
            if (results.length > 0) setIsOpen(true)
          }}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden max-h-72">
          {results.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-500">No patients found</div>
          ) : (
            <div className="py-1">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50">
                Patients Found ({results.length})
              </div>
              {results.map((pat) => (
                <button
                  key={pat.id}
                  onClick={() => handleSelect(pat.id)}
                  className="w-full px-4 py-2.5 hover:bg-slate-50 text-left flex items-start gap-3 border-b last:border-0 border-slate-100 transition-colors"
                >
                  <div className="p-1.5 rounded-full bg-blue-50 text-blue-600 mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{pat.name}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span className="flex items-center gap-0.5 font-mono"><Clipboard className="h-3 w-3" /> {pat.uhid}</span>
                      <span className="flex items-center gap-0.5"><Phone className="h-3 w-3" /> {pat.mobile}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
