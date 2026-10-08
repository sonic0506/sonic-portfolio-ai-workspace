import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { MarkdownEditor } from './markdown-editor'

function Harness({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial)
  return <MarkdownEditor id="body" value={value} onChange={setValue} />
}

describe('MarkdownEditor', () => {
  afterEach(cleanup)

  it('미리보기를 포트폴리오 렌더러로 그리고 추천 질문 블록도 보여 준다', () => {
    render(<Harness initial={'**굵게**\n\n:::questions\n- 무엇을 했나요?\n:::'} />)
    const preview = screen.getByLabelText('미리보기')
    expect(preview.querySelector('strong')?.textContent).toBe('굵게')
    expect(preview.textContent).toContain('무엇을 했나요?')
  })

  it('툴바 버튼과 단축키가 입력창 값을 바꾼다', () => {
    render(<Harness initial="글" />)
    const area = screen.getByRole('textbox') as HTMLTextAreaElement
    area.setSelectionRange(0, 1)
    fireEvent.keyDown(area, { key: 'b', metaKey: true })
    expect(area.value).toBe('**글**')
    fireEvent.click(screen.getByLabelText('표'))
    expect(area.value).toContain('| --- | --- |')
  })
})
