'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';

import { cn } from '@/lib/utils';

/** 복사했다는 표시를 유지하는 시간. */
const COPIED_MS = 1500;

/**
 * 하이라이트는 토큰 안에서만 한다. 주석은 text-3, 문자열은 accent-text,
 * 예약어는 text-2, 나머지는 text-1. 색이 다섯 개가 되는 순간 코드가 아니라
 * 무지개가 된다.
 */
const KEYWORDS = [
  'async',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'def',
  'default',
  'delete',
  'elif',
  'else',
  'export',
  'extends',
  'finally',
  'for',
  'from',
  'function',
  'if',
  'import',
  'in',
  'interface',
  'let',
  'new',
  'not',
  'or',
  'and',
  'return',
  'self',
  'switch',
  'throw',
  'try',
  'type',
  'typeof',
  'var',
  'while',
  'yield',
  'None',
  'True',
  'False',
  'null',
  'true',
  'false',
  'SELECT',
  'FROM',
  'WHERE',
  'JOIN',
  'ON',
  'ORDER',
  'BY',
  'LIMIT',
  'GROUP',
  'AND',
  'OR',
  'AS',
  'INSERT',
  'UPDATE',
  'DELETE',
].join('|');

const HASH_COMMENT = [
  'bash',
  'sh',
  'shell',
  'python',
  'nginx',
  'yaml',
  'yml',
  'toml',
];

/**
 * 언어마다 주석 기호가 다르다. 언어별로 하나만 보게 해야 URL의 //가 주석으로
 * 잘리지 않는다.
 */
function commentPattern(lang: string | null) {
  if (lang === 'sql') return '--[^\\n]*';
  if (lang && HASH_COMMENT.includes(lang)) return '#[^\\n]*';

  return '\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/';
}

interface Token {
  value: string;
  kind: 'comment' | 'string' | 'keyword' | 'plain';
}

function tokenize(code: string, lang: string | null): Token[] {
  const pattern = new RegExp(
    [
      `(${commentPattern(lang)})`,
      `("[^"\\n]*"|'[^'\\n]*'|\`[^\`]*\`)`,
      `\\b(${KEYWORDS})\\b`,
    ].join('|'),
    'g',
  );

  const tokens: Token[] = [];
  let last = 0;

  for (const match of code.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) {
      tokens.push({ value: code.slice(last, index), kind: 'plain' });
    }

    const [raw, comment, string] = match;
    tokens.push({
      value: raw,
      kind: comment ? 'comment' : string ? 'string' : 'keyword',
    });
    last = index + raw.length;
  }

  if (last < code.length) {
    tokens.push({ value: code.slice(last), kind: 'plain' });
  }

  return tokens;
}

const TOKEN_COLOR: Record<Token['kind'], string> = {
  comment: 'text-text-3',
  string: 'text-accent-text',
  keyword: 'text-text-2',
  plain: 'text-text-1',
};

export interface CodeBlockProps {
  code: string;
  /** 없으면 라벨을 그리지 않는다. 자리를 비워 두지 않는다. */
  lang: string | null;
}

/** 본문 코드 블록. 복사 버튼은 블록에 마우스를 올렸을 때만 나타난다. */
export function CodeBlock({ code, lang }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // 권한이 없거나 보안 컨텍스트가 아니면 조용히 넘어간다. 알릴 일은 아니다.
      return;
    }

    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };

  return (
    <div className="group relative my-6 rounded-md border border-border bg-surface p-4">
      {/* 복사 버튼과 언어 라벨은 코드 위에 겹쳐 둔다. 코드 폭을 줄이지 않는다. */}
      <div className="absolute top-2.5 right-3 flex items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? '복사됨' : '코드 복사'}
          className={cn(
            'flex size-6 cursor-pointer items-center justify-center rounded-xs text-text-2 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface-hi hover:text-text-1 focus-visible:opacity-100',
            copied && 'opacity-100',
          )}
        >
          {copied ? (
            <Check className="size-[13px]" strokeWidth={1.5} />
          ) : (
            <Copy className="size-[13px]" strokeWidth={1.5} />
          )}
        </button>

        {lang && (
          <span className="font-mono text-[10px] text-text-3">{lang}</span>
        )}
      </div>

      <pre className="overflow-x-auto font-mono text-sm leading-[1.6]">
        <code>
          {tokenize(code, lang).map((token, index) => (
            <span key={index} className={TOKEN_COLOR[token.kind]}>
              {token.value}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
