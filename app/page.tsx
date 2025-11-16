import TimerCard from '@/components/timer-card'
import TimeEntriesList from '@/components/time-entries-list'

export default function Home() {
  return (
    <div className="min-h-screen bg-muted/40 p-4 flex justify-center">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <div className="sticky top-4 z-10">
          <TimerCard />
        </div>
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Recent entries</h2>
            <p className="text-sm text-muted-foreground">
              Start/stop times with selected tags.
            </p>
          </div>
          <TimeEntriesList />
        </section>
      </div>
    </div>
  )
}
