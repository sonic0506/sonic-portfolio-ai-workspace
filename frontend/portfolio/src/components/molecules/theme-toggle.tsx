'use client';

import { useSyncExternalStore } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { SidebarMenuButton } from '@/components/ui/sidebar';

const ORDER = ['system', 'light', 'dark'] as const;
const LABEL = { system: '시스템 테마', light: '라이트 테마', dark: '다크 테마' };
const ICON = { system: Monitor, light: Sun, dark: Moon };

const noop = () => () => {};

/** 누를 때마다 시스템 → 라이트 → 다크 순으로 바꾼다. 기본은 시스템 설정을 따른다. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // 서버 렌더에서는 저장된 테마를 알 수 없으므로 마운트 뒤에만 실제 값을 쓴다.
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const current = mounted && (theme === 'light' || theme === 'dark') ? theme : 'system';
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
  const Icon = ICON[current];

  return (
    <SidebarMenuButton tooltip={LABEL[current]} onClick={() => setTheme(next)} aria-label={`${LABEL[current]} (눌러서 ${LABEL[next]})`}>
      <Icon strokeWidth={1.5} />
      <span>{LABEL[current]}</span>
    </SidebarMenuButton>
  );
}
