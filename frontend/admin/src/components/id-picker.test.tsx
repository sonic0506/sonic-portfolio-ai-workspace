import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { IdPicker } from './id-picker'

const options = [
  { id: 1, code: 'java', name: 'Java' },
  { id: 2, code: 'spring', name: 'Spring' },
]

function Harness() {
  const [value, setValue] = useState([1, 2])
  return <IdPicker options={options} value={value} onChange={setValue} sortable />
}

describe('IdPicker sortable', () => {
  afterEach(cleanup)

  it('끌기 가능한 칩에서도 ✕로 뺄 수 있고 키보드 입력이 드래그로 넘어가지 않는다', () => {
    render(<Harness />)
    expect(screen.getByLabelText('Java, 끌어서 순서 변경')).toBeTruthy()
    const remove = screen.getByLabelText('Java 빼기')
    fireEvent.keyDown(remove, { key: ' ', code: 'Space' })
    expect(document.querySelector('[aria-pressed="true"]')).toBeNull()
    fireEvent.click(remove)
    expect(screen.queryByLabelText('Java, 끌어서 순서 변경')).toBeNull()
    expect(screen.getByText('+ Java')).toBeTruthy()
  })
})
