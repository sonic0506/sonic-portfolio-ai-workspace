import { useSyncExternalStore } from 'react';

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    // 서버에서는 화면 크기를 모르므로 데스크톱으로 그린다.
    () => false,
  );
}

/** 768px 미만: 사이드바가 드로어로 빠진다. */
export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)');
}

/** 사이드바가 64px 아이콘 레일로 접히는 구간. */
export function useIsTablet() {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}
