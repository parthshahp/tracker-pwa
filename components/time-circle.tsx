'use client'
import { useState, useEffect } from 'react'

export default function TimeCircle() {
  const [seconds, setSeconds] = useState(0)
  const [timerActive, setTimerActive] = useState(false)

  function toggleTimer() {
    setTimerActive(!timerActive);
  }

  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => { setSeconds((s) => s + 1) }, 1000);

    return () => clearInterval(interval);
  }, [timerActive]);

  return (
    <button onClick={toggleTimer} className="border-amber-400 border-2 p-18 rounded-4xl">
      {seconds}
    </button>
  )
}
