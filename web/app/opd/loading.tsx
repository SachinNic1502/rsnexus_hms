import { TableSkeleton } from '@/components/ui/skeleton'

export default function OPDLoading() {
  return (
    <div className="p-8">
      <div className="mb-6 space-y-2">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
        <div className="h-4 w-64 bg-gray-200 animate-pulse rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-white p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
                <div className="h-3 w-24 bg-gray-200 animate-pulse rounded" />
              </div>
            </div>
            <div className="h-3 w-full bg-gray-200 animate-pulse rounded" />
            <div className="h-3 w-3/4 bg-gray-200 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
