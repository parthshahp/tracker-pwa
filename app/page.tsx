import TimerCard from '@/components/timer-card'
import TimeEntriesList from '@/components/time-entries-list'

export default function Home() {
  return (
    // <div className="min-h-screen bg-[#03050c] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_55%)] px-4 py-10 text-white/90 sm:px-6 lg:px-8">
    <div className="min-h-screen bg-[radial-gradient(circle_at_right,rgba(255,255,255,0.18),transparent_30%)] px-4 py-10 text-white/90 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-10">
        <div className="sticky top-6 z-10 w-full max-w-2xl drop-shadow-2xl">
          <TimerCard />
        </div>
        <section className="glass-panel glass-panel-strong w-full max-w-2xl space-y-4 rounded-3xl border-white/10 p-6 shadow-2xl shadow-black/40 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">Recent entries</h2>
              <p className="text-sm text-white/70">
                Start/stop times with selected tags.
              </p>
            </div>
          </div>
          <TimeEntriesList />
        </section>
      </div>
    </div>
  )
}
