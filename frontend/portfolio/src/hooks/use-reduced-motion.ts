import { useSyncExternalStore } from 'react';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener('change', onChange);

  return () => query.removeEventListener('change', onChange);
}

/**
 * 움직임을 줄이라는 시스템 설정. 서버에서는 알 수 없어 false로 두고,
 * 하이드레이션 뒤에 실제 값으로 맞춘다.
 */
export function useReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}
