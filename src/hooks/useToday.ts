import { useState } from 'react'

/**
 * The current date, captured once when the component mounts. Gives views a
 * stable "today" without calling `new Date()` during render (render must be pure).
 */
export function useToday(): Date {
  const [today] = useState(() => new Date())
  return today
}
