import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { IdPicker } from './id-picker'

const options = [
  { id: 1, code: 'java', name: 'Java' },
  { id: 2, code: 'spring', name: 'Spring' },
  { id: 3, code: 'react', name: 'React' },
]

function Harness() {
  const [value, setValue] = useState([1, 2, 3])
  return <IdPicker options={options} value={value} onChange={setValue} sortable />
}

const chips = () => [...document.querySelectorAll('[draggable="true"]')].map((el) => el.textContent)
const chip = (name: string) => screen.getByText(name).closest('[draggable]')!

describe('IdPicker sortable', () => {
  afterEach(cleanup)

  it('칩을 끌어 놓으면 놓은 자리로 옮긴다', () => {
    render(<Harness />)
    fireEvent.dragStart(chip('Java'), { dataTransfer: { setData: () => {} } })
    fireEvent.dragOver(chip('React'))
    fireEvent.drop(chip('React'))
    expect(chips()).toEqual(['Spring', 'React', 'Java'])
  })

  it('◀ ▶ 버튼으로 한 칸씩 옮긴다', () => {
    render(<Harness />)
    fireEvent.click(screen.getByLabelText('React 앞으로'))
    expect(chips()).toEqual(['Java', 'React', 'Spring'])
    fireEvent.click(screen.getByLabelText('Java 뒤로'))
    expect(chips()).toEqual(['React', 'Java', 'Spring'])
  })
})
