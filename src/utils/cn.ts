type ClassValue = string | number | false | null | undefined

/** Joins truthy class names. Components avoid passing conflicting Tailwind utilities. */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ')
}
