import { useEffect, useRef, type RefObject } from 'react'

/** Calls `handler` on pointer-down outside every given element, and on Escape. */
export function useClickOutside(
  refs: RefObject<HTMLElement | null>[],
  handler: () => void,
  enabled = true,
): void {
  const handlerRef = useRef(handler)
  const refsRef = useRef(refs)

  useEffect(() => {
    handlerRef.current = handler
    refsRef.current = refs
  })

  useEffect(() => {
    if (!enabled) return
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node
      if (refsRef.current.some((ref) => ref.current?.contains(target))) return
      handlerRef.current()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handlerRef.current()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [enabled])
}
