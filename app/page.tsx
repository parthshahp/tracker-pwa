import TimerCard from "@/components/timer-card";
import TimeEntriesList from "@/components/time-entries-list";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-10 px-2 md:px-0">
      <div className="sticky top-6 z-10 w-full max-w-2xl drop-shadow-2xl">
        <TimerCard />
      </div>
      <section className="glass-panel w-full max-w-2xl space-y-4 py-6 px-4 sm:py-8">
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
  );
}
