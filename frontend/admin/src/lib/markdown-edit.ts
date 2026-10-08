// 마크다운 에디터 툴바 동작. 입력창의 값과 선택 범위를 받아 새 값과 새 선택 범위를 돌려준다.
export type Edit = { value: string; start: number; end: number }

/** 선택한 글자를 기호로 감싼다. 이미 감싸져 있으면 푼다. 선택이 없으면 placeholder를 넣고 고른다. */
export function wrap(value: string, start: number, end: number, mark: string, placeholder = '텍스트'): Edit {
  const n = mark.length
  if (value.slice(start - n, start) === mark && value.slice(end, end + n) === mark) {
    return { value: value.slice(0, start - n) + value.slice(start, end) + value.slice(end + n), start: start - n, end: end - n }
  }
  const text = value.slice(start, end) || placeholder
  return { value: value.slice(0, start) + mark + text + mark + value.slice(end), start: start + n, end: start + n + text.length }
}

/** 선택이 걸친 줄마다 접두어를 붙인다. 모든 줄에 이미 있으면 뗀다. 제목(#)은 다른 제목 수준을 바꿔 단다. */
export function prefixLines(value: string, start: number, end: number, prefix: string): Edit {
  const from = value.lastIndexOf('\n', start - 1) + 1
  const lineEnd = value.indexOf('\n', end)
  const to = lineEnd === -1 ? value.length : lineEnd
  const lines = value.slice(from, to).split('\n')
  const heading = prefix.startsWith('#')
  const has = (line: string) => line.startsWith(prefix)
  const next = lines.every(has)
    ? lines.map((line) => line.slice(prefix.length))
    : lines.map((line) => prefix + (heading ? line.replace(/^#{1,6}\s+/, '') : line))
  const block = next.join('\n')
  return { value: value.slice(0, from) + block + value.slice(to), start: from, end: from + block.length }
}

/**
 * 선택을 text로 바꿔 넣는다. block이면 앞뒤를 빈 줄로 띄워 문단으로 만든다.
 * select는 text 안에서 고를 범위다(없으면 text 끝에 커서).
 */
export function insert(value: string, start: number, end: number, text: string, block = false, select?: [number, number]): Edit {
  let before = value.slice(0, start)
  let after = value.slice(end)
  if (block) {
    before = before.replace(/\n*$/, '')
    before = before ? `${before}\n\n` : ''
    after = `\n\n${after.replace(/^\n*/, '')}`
  }
  const [s, e] = select ?? [text.length, text.length]
  return { value: before + text + after, start: before.length + s, end: before.length + e }
}

/** 선택을 링크 글자로 쓰고 주소 자리를 고른다. */
export function link(value: string, start: number, end: number, url = 'https://'): Edit {
  const text = value.slice(start, end) || '링크'
  const md = `[${text}](${url})`
  return insert(value, start, end, md, false, [text.length + 3, text.length + 3 + url.length])
}

export const TABLE = '| 항목 | 내용 |\n| --- | --- |\n|  |  |'
export const QUESTIONS = ':::questions\n- 질문\n:::'
