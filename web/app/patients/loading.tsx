import { TableSkeleton } from '@/components/ui/skeleton'

export default function PatientsLoading() {
  return (
    <div className="p-8">
      <div className="mb-6 space-y-2">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
        <div className="h-4 w-64 bg-gray-200 animate-pulse rounded" />
      </div>
      <TableSkeleton rows={8} cols={6} />
    </div>
  )
}
