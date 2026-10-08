import { describe, expect, it } from 'vitest'
import { insert, link, prefixLines, wrap } from './markdown-edit'

describe('markdown-edit', () => {
  it('선택을 굵게 감싸고, 다시 누르면 푼다', () => {
    const bold = wrap('a bc d', 2, 4, '**')
    expect(bold).toEqual({ value: 'a **bc** d', start: 4, end: 6 })
    expect(wrap(bold.value, bold.start, bold.end, '**')).toEqual({ value: 'a bc d', start: 2, end: 4 })
  })

  it('제목은 기존 수준을 바꾸고 같은 수준이면 뗀다', () => {
    expect(prefixLines('## 제목', 3, 3, '### ').value).toBe('### 제목')
    expect(prefixLines('### 제목', 0, 0, '### ').value).toBe('제목')
  })

  it('목록은 선택한 모든 줄에 붙인다', () => {
    expect(prefixLines('x\na\nb\ny', 2, 5, '- ').value).toBe('x\n- a\n- b\ny')
  })

  it('블록은 앞뒤를 빈 줄로 띄운다', () => {
    expect(insert('앞\n뒤', 1, 1, 'B', true).value).toBe('앞\n\nB\n\n뒤')
    expect(insert('', 0, 0, 'B', true)).toEqual({ value: 'B\n\n', start: 1, end: 1 })
  })

  it('링크는 주소 자리를 고른다', () => {
    const edit = link('글 보기', 0, 1)
    expect(edit.value).toBe('[글](https://) 보기')
    expect(edit.value.slice(edit.start, edit.end)).toBe('https://')
  })
})
