'use client';

import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface HeroFadeTextProps {
  /** 한 화면에 함께 띄울 줄들을 하나의 슬라이드로 묶는다. 수치는 mono 조각으로 넘긴다. */
  slides: ReactNode[][];
  fadeInDuration?: number;
  holdDuration?: number;
  fadeOutDuration?: number;
  gapDuration?: number;
  className?: string;
  /** 정렬·크기를 쓰는 자리에 맞춘다. 기본값은 좌측 정렬 20px. */
  textClassName?: string;
}

/** 등장은 아래에서, 퇴장은 위로. 배경처럼 읽히도록 진폭은 6px을 넘기지 않는다. */
const TRAVEL = 6;
const ENTER_KEYFRAMES = 'hero-fade-enter';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** in 구간이 fade in과 hold를 함께 소화한다. out은 퇴장, gap은 완전히 사라진 뒤의 공백. */
type Phase = 'in' | 'out' | 'gap';

interface UseFadeCycleOptions {
  slideCount: number;
  fadeInDuration: number;
  holdDuration: number;
  fadeOutDuration: number;
  gapDuration: number;
}

function useFadeCycle({
  slideCount,
  fadeInDuration,
  holdDuration,
  fadeOutDuration,
  gapDuration,
}: UseFadeCycleOptions) {
  // 서버와 첫 렌더는 언제나 '첫 슬라이드가 이미 떠 있는' 상태다. 그래서 hydration이 어긋날 여지가 없고,
  // 타이머는 이펙트에서만 걸리므로 순환은 자연히 마운트 이후에 시작된다.
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('in');

  // 아래 두 값은 렌더 결과가 아니라 타이머 가동 여부에만 쓰이므로 초기값이 서버와 달라도 안전하다.
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === 'undefined' || !document.hidden,
  );
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia(REDUCED_MOTION_QUERY).matches,
  );

  useEffect(() => {
    const handleVisibility = () => {
      const visible = !document.hidden;

      setPageVisible(visible);
      // 탭에서 돌아오면 보던 슬라이드를 처음부터 다시 보여준다.
      if (visible) setPhase('in');
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const handleChange = () => setReducedMotion(query.matches);

    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  const running = !reducedMotion && pageVisible && slideCount > 1;

  // 렌더당 타이머는 정확히 하나. cleanup이 그것을 지우므로 StrictMode 이중 실행에도 쌓이지 않는다.
  useEffect(() => {
    if (!running) return;

    let timer: ReturnType<typeof setTimeout>;

    if (phase === 'in') {
      timer = setTimeout(() => setPhase('out'), fadeInDuration + holdDuration);
    } else if (phase === 'out') {
      timer = setTimeout(() => setPhase('gap'), fadeOutDuration);
    } else {
      timer = setTimeout(() => {
        setIndex((value) => (value + 1) % slideCount);
        setPhase('in');
      }, gapDuration);
    }

    return () => clearTimeout(timer);
  }, [
    running,
    phase,
    slideCount,
    fadeInDuration,
    holdDuration,
    fadeOutDuration,
    gapDuration,
  ]);

  const offset = phase === 'in' ? 0 : phase === 'out' ? -TRAVEL : TRAVEL;

  const activeStyle: CSSProperties = {
    opacity: phase === 'in' ? 1 : 0,
    transform: `translateY(${offset}px)`,
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: phase === 'out' ? 'ease-in' : 'ease-out',
    // gap은 전환 없이 되감는 구간이라 0ms. 이때 아래에서 다시 올라올 위치로 순간 이동한다.
    transitionDuration:
      phase === 'in'
        ? `${fadeInDuration}ms`
        : phase === 'out'
          ? `${fadeOutDuration}ms`
          : '0ms',
    willChange: 'opacity, transform',
  };

  return { index, activeStyle };
}

/** 대기 중인 슬라이드는 다음에 올라올 자리에서 투명하게 기다린다. */
const RESTING_STYLE: CSSProperties = {
  opacity: 0,
  transform: `translateY(${TRAVEL}px)`,
  transitionProperty: 'none',
};

// 읽기 문장이므로 Pretendard. 정렬과 크기는 textClassName으로 덮어쓴다.
const TEXT_CLASS =
  'col-start-1 row-start-1 self-end text-left font-body text-lg leading-relaxed font-normal break-keep text-text-2';

export function HeroFadeText({
  slides,
  fadeInDuration = 600,
  holdDuration = 2800,
  fadeOutDuration = 500,
  gapDuration = 200,
  className,
  textClassName,
}: HeroFadeTextProps) {
  const { index, activeStyle } = useFadeCycle({
    slideCount: slides.length,
    fadeInDuration,
    holdDuration,
    fadeOutDuration,
    gapDuration,
  });

  const lastSlide = slides[slides.length - 1] ?? [];

  return (
    // 모든 슬라이드를 같은 그리드 칸에 겹쳐 쌓는다. 칸 높이가 늘 가장 큰 슬라이드에 맞춰지므로
    // min-height를 브레이크포인트마다 손으로 맞추지 않아도 아래 입력창이 밀리지 않는다.
    <div className={cn('grid justify-items-start', className)}>
      <style href={ENTER_KEYFRAMES} precedence="medium">
        {`@keyframes ${ENTER_KEYFRAMES}{from{opacity:0;transform:translateY(${TRAVEL}px)}to{opacity:1;transform:translateY(0)}}`}
      </style>

      {slides.map((slide, slideIndex) => (
        <p
          key={slideIndex}
          aria-hidden="true"
          style={{
            ...(slideIndex === index ? activeStyle : RESTING_STYLE),
            // 첫 슬라이드는 SSR에서 이미 떠 있어 전환이 걸리지 않으니 등장만 애니메이션으로 준다.
            // fill-mode가 backwards라 끝난 뒤에는 값을 붙들지 않고, 이후 순환은 transition이 맡는다.
            ...(slideIndex === 0 && {
              animation: `${ENTER_KEYFRAMES} ${fadeInDuration}ms ease-out backwards`,
            }),
          }}
          className={cn(TEXT_CLASS, textClassName, 'motion-reduce:hidden')}
        >
          {slide.map((line, lineIndex) => (
            <span key={lineIndex} className="block">
              {line}
            </span>
          ))}
        </p>
      ))}

      {/*
        reduced-motion은 JS 상태가 아니라 CSS로 갈아끼운다.
        마운트 후 문구가 바뀌는 깜빡임 없이 처음부터 마지막 슬라이드가 보인다.
      */}
      <p
        aria-hidden="true"
        className={cn(TEXT_CLASS, textClassName, 'hidden motion-reduce:block')}
      >
        {lastSlide.map((line, lineIndex) => (
          <span key={lineIndex} className="block">
            {line}
          </span>
        ))}
      </p>

      {/* 4초마다 읽히지 않도록 aria-live 없이, 전문을 한 번만 노출한다. */}
      <span className="sr-only">
        {slides.map((slide, slideIndex) => (
          <span key={slideIndex}>
            {slide.map((line, lineIndex) => (
              <span key={lineIndex}>{line} </span>
            ))}
          </span>
        ))}
      </span>
    </div>
  );
}
