import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FabButton } from '@/shared/ui/components/FabButton'

describe('FabButton', () => {
  it('renders children', () => {
    render(<FabButton>X</FabButton>)
    expect(screen.getByText('X')).toBeInTheDocument()
  })

  it('renders label as aria-label and tooltip text', () => {
    render(<FabButton label="Cerrar">X</FabButton>)
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument()
  })

  it('does not show badge when value is 0', () => {
    const { container } = render(<FabButton badge={0}>X</FabButton>)
    expect(container.querySelector('.min-w-5')).not.toBeInTheDocument()
  })

  it('shows badge when value > 0', () => {
    render(<FabButton badge={3}>X</FabButton>)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<FabButton className="extra-class">X</FabButton>)
    expect(container.querySelector('button')).toHaveClass('extra-class')
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    let clicked = false
    render(<FabButton onClick={() => { clicked = true }}>X</FabButton>)
    await user.click(screen.getByRole('button'))
    expect(clicked).toBe(true)
  })
})
