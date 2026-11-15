import { useEffect, useState } from 'react'

/**
 * Cronômetro local sincronizado com a API: parte de `clock.elapsedSeconds` e, quando
 * `clock.running` é true, soma os segundos passados desde a última resposta do servidor.
 */
export function useMatchClock(clock) {
  const [syncedAt, setSyncedAt] = useState(() => Date.now())
  const [, setTick] = useState(0)

  useEffect(() => { setSyncedAt(Date.now()) }, [clock?.elapsedSeconds, clock?.running])

  useEffect(() => {
    if (!clock?.running) return
    const t = setInterval(() => setTick((x) => x + 1), 500)
    return () => clearInterval(t)
  }, [clock?.running])

  if (!clock) return 0
  return clock.elapsedSeconds + (clock.running ? Math.floor((Date.now() - syncedAt) / 1000) : 0)
}

export function formatClock(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
