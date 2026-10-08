import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Career } from '@/lib/types';
import { formatTenure } from '@/lib/utils';
import { CareerEntry } from './career-entry';

const career: Career = {
  company: '슬로그업',
  role: 'FE 개발자',
  periodStart: '2021-08-02',
  periodEnd: '2026-09-30',
  description: '회사 소개',
  employmentType: '정규직',
  position: null,
  achievements: [
    {
      title: 'VIORA',
      periodStart: '2026-07-01',
      periodEnd: '2026-09-01',
      job: null,
      position: null,
      bodyMarkdown: '[주요 성과]\n- **처리 위치(STT)**를 제안했습니다.',
      project: { slug: 'viora', title: 'VIORA', url: '/projects/viora' },
    },
    { title: '사내 작업', periodStart: '2025-01-01', periodEnd: null, job: '앱 개발', position: 'PL', bodyMarkdown: null, project: null },
  ],
};

describe('formatTenure', () => {
  it('원티드처럼 시작·끝 달을 모두 센다', () => {
    expect(formatTenure('2021-08-02', '2026-09-30')).toBe('2021.08 - 2026.09 (5년 2개월)');
    expect(formatTenure('2021-08-01', null, new Date(2026, 9, 8))).toBe('2021.08 - 재직 중 (5년 3개월)');
    expect(formatTenure('2024-11-01', '2025-04-01')).toBe('2024.11 - 2025.04 (6개월)');
  });
});

describe('CareerEntry (ADR-0019)', () => {
  // vitest globals가 꺼져 있어 Testing Library 자동 정리가 동작하지 않는다.
  afterEach(cleanup);

  it('경력 메타 줄은 값이 있는 항목만 잇는다', () => {
    const { container } = render(<CareerEntry career={career} />);
    const meta = container.querySelector('h3 + p')?.textContent;
    expect(meta).toBe('2021.08 - 2026.09 (5년 2개월)|정규직|FE 개발자');
  });

  it('성과는 제목·기간·상세를 보이고, 공개 프로젝트면 링크한다', () => {
    render(<CareerEntry career={career} />);
    expect(screen.getByRole('link', { name: /VIORA/ }).getAttribute('href')).toBe('/projects/viora');
    expect(screen.getByText('처리 위치(STT)').tagName).toBe('STRONG');
    expect(screen.getByRole('heading', { name: '사내 작업' })).toBeTruthy();
    expect(screen.getByText('2025.01 - 진행 중')).toBeTruthy();
    expect(screen.getByText('PL')).toBeTruthy();
  });
});
