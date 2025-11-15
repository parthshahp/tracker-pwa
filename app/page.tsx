import TimerCard from '@/components/timer-card'
import { TimeEntriesList } from '@/components/time-entries-list'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-3xl space-y-8">
        <TimerCard />
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Recent entries</h2>
            <p className="text-sm text-muted-foreground">Start/stop times with selected tags.</p>
          </div>
          <TimeEntriesList />
        </section>
      </div>
    </div>
  )
}
