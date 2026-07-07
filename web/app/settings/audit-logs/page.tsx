"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Loader2, ClipboardList, Search, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

interface AuditLog {
  id: string
  userName: string
  userRole: string
  action: string
  details: string
  createdAt: string
}

export default function AuditLogsPage() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')

  useEffect(() => {
    fetchLogs()
  }, [actionFilter])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (actionFilter !== 'all') params.set('action', actionFilter)
      if (search.trim()) params.set('search', search)
      const res = await fetch(`/api/audit-logs?${params}`)
      if (res.ok) {
        setLogs(await res.json())
      }
    } catch {
      toast('Failed to fetch system audit logs', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchLogs()
  }

  const getActionBadgeClass = (action: string) => {
    switch (action.toUpperCase()) {
      case 'DISCHARGE': return 'bg-purple-100 text-purple-800'
      case 'PAYMENT': return 'bg-green-100 text-green-800'
      case 'STOCK_UPDATE': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <Link href="/settings">
            <Button variant="ghost" className="mb-2 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Settings
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-8 w-8 text-blue-600" />
            System Audit Logs
          </h1>
          <p className="text-gray-600 mt-1">Track actions and state changes across the system</p>
        </div>
        <Button onClick={fetchLogs} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[240px]">
              <label className="text-xs font-semibold text-gray-500 uppercase">Search Details or Username</label>
              <div className="relative mt-1.5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="e.g. Paracetamol, John Doe..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Filter Action</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="flex h-10 w-44 mt-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Actions</option>
                <option value="DISCHARGE">Discharge</option>
                <option value="PAYMENT">Payment</option>
                <option value="STOCK_UPDATE">Stock Update</option>
              </select>
            </div>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white h-10">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="p-4 font-semibold text-gray-700">Timestamp</th>
                    <th className="p-4 font-semibold text-gray-700">Staff User</th>
                    <th className="p-4 font-semibold text-gray-700">Role</th>
                    <th className="p-4 font-semibold text-gray-700">Action</th>
                    <th className="p-4 font-semibold text-gray-700">Log Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        No system audit log entries found matching criteria
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-slate-50/50">
                        <td className="p-4 text-gray-600 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4 font-medium text-gray-900">{log.userName}</td>
                        <td className="p-4 text-gray-500 capitalize">
                          {log.userRole.replace('_', ' ')}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider ${getActionBadgeClass(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 text-gray-700 max-w-md break-words">{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
