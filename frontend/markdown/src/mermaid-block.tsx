'use client';

import { useEffect, useState } from 'react';
import { CodeBlock } from './code-block';

/** 사이트 색 토큰을 읽어 mermaid 색으로 넘긴다. 다크 모드 방식(포트폴리오 .dark, 어드민 media)과 상관없이 지금 보이는 색을 따른다. */
function themeVariables() {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    fontFamily: getComputedStyle(document.body).fontFamily,
    background: 'transparent',
    primaryColor: v('--s-surface-hi'),
    primaryTextColor: v('--s-text-1'),
    primaryBorderColor: v('--s-text-3'),
    secondaryColor: v('--s-surface'),
    tertiaryColor: v('--s-surface'),
    lineColor: v('--s-text-2'),
    textColor: v('--s-text-1'),
    noteBkgColor: v('--s-surface'),
    noteTextColor: v('--s-text-2'),
  };
}

/** mermaid 임시 요소 id. 렌더링마다 새로 써야 겹친 렌더링(StrictMode 이중 실행)이 서로의 요소를 지우지 않는다. */
let seq = 0;

/** 테마가 바뀌면 다시 그리도록 숫자를 올린다. */
function useThemeVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((n) => n + 1);
    const observer = new MutationObserver(bump);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    const media = matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', bump);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', bump);
    };
  }, []);
  return version;
}

/**
 * ```mermaid 펜스를 그림으로 그린다. mermaid는 크기가 커서 그림이 있는 글에서만 불러온다.
 * 불러오는 중이거나 문법 오류면 원문 코드 블록을 그대로 보여 준다.
 */
export function MermaidBlock({ code }: { code: string }) {
  const themeVersion = useThemeVersion();
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const id = `mermaid-${++seq}`;
    (async () => {
      try {
        const { default: mermaid } = await import('mermaid');
        // strict: 라벨 안 HTML·클릭 스크립트를 막는다.
        mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'base', themeVariables: themeVariables() });
        const result = await mermaid.render(id, code);
        if (!cancelled) setSvg(result.svg);
      } catch {
        // 문법 오류는 원문을 보여 주면 충분하다. mermaid가 body에 남기는 임시 요소(오류 그림)는 지운다.
        document.getElementById(`d${id}`)?.remove();
        if (!cancelled) setSvg(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, themeVersion]);

  if (!svg) return <CodeBlock code={code} lang="mermaid" />;

  return (
    <div
      role="img"
      aria-label="다이어그램"
      className="my-6 overflow-x-auto rounded-md border border-border bg-surface p-4 [&_svg]:mx-auto [&_svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
