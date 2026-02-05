'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-foreground">
        Something went wrong
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        An error occurred in the admin panel. Please try again or check the
        console for details.
      </p>
      <div className="mt-8 flex gap-4">
        <Button onClick={reset}>Try Again</Button>
        <Button variant="outline" asChild>
          <a href="/admin">Back to Dashboard</a>
        </Button>
      </div>
    </div>
  )
}
