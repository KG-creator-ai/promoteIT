import { useEffect, RefObject } from 'react';

type EventType = 'mousedown' | 'touchstart';

export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: MouseEvent | TouchEvent) => void,
  eventType: EventType = 'mousedown',
  ignoreRefs: RefObject<HTMLElement | null>[] = []
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!target || !document.contains(target)) {
        return;
      }

      // Check if clicked inside main container ref
      const el = ref.current;
      if (el && el.contains(target)) {
        return;
      }

      // Check if clicked inside any of the ignoreRefs
      for (const ignoreRef of ignoreRefs) {
        if (ignoreRef.current && ignoreRef.current.contains(target)) {
          return;
        }
      }

      handler(event);
    };

    document.addEventListener(eventType, listener);
    return () => {
      document.removeEventListener(eventType, listener);
    };
  }, [ref, handler, eventType, ignoreRefs]);
}
