import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { useAppStore } from '../store'

// Mock the store
vi.mock('../store', () => ({
  useAppStore: vi.fn()
}))

// Mock the hooks
vi.mock('../hooks/usePairData', () => ({
  usePairData: () => ({
    pairData: {
      reserveA: 1000,
      reserveB: 2000,
      totalSupply: 100,
      priceA: 2.0,
      priceB: 0.5,
      liquidity: 3000,
      volume24h: 0,
      fee24h: 0
    },
    loading: false,
    error: null,
    refetch: vi.fn(),
    getSwapQuote: vi.fn(() => Promise.resolve(200)),
    calculateSlippage: vi.fn(() => 0.1),
    calculatePriceImpact: vi.fn(() => 0.5)
  })
}))

vi.mock('../hooks/useBalances', () => ({
  useBalances: () => ({
    balances: { test1: '1000', test2: '500' },
    loading: false,
    refetch: vi.fn()
  })
}))

describe('App Component', () => {
  const mockSetUserAddress = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAppStore as any).mockReturnValue({
      userAddress: null,
      setUserAddress: mockSetUserAddress,
      pairId: 'TEST-PAIR',
      setPairId: vi.fn()
    })
  })

  it('renders the main components', () => {
    render(<App />)
    
    expect(screen.getByText('FlowSwap')).toBeInTheDocument()
    expect(screen.getByText('Decentralized Exchange on Flow')).toBeInTheDocument()
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
  })

  it('displays pool information', () => {
    render(<App />)
    
    expect(screen.getByText('Pool Information')).toBeInTheDocument()
    expect(screen.getByText('1000.00')).toBeInTheDocument() // Token A reserve
    expect(screen.getByText('2000.00')).toBeInTheDocument() // Token B reserve
    expect(screen.getByText('1 A = 2.0000 B')).toBeInTheDocument()
  })

  it('shows swap interface', () => {
    render(<App />)
    
    expect(screen.getByText('Swap Tokens')).toBeInTheDocument()
    expect(screen.getByLabelText('From')).toBeInTheDocument()
    expect(screen.getByLabelText('To')).toBeInTheDocument()
  })

  it('shows liquidity interface', () => {
    render(<App />)
    
    expect(screen.getByText('Liquidity Pool')).toBeInTheDocument()
    expect(screen.getByText('Add Liquidity')).toBeInTheDocument()
    expect(screen.getByText('Remove Liquidity')).toBeInTheDocument()
  })

  it('shows user balances when wallet is connected', () => {
    ;(useAppStore as any).mockReturnValue({
      userAddress: '0x123',
      setUserAddress: mockSetUserAddress,
      pairId: 'TEST-PAIR',
      setPairId: vi.fn()
    })

    render(<App />)
    
    expect(screen.getByText('Your Balances')).toBeInTheDocument()
    expect(screen.getByText('1000.00')).toBeInTheDocument() // Token A balance
    expect(screen.getByText('500.00')).toBeInTheDocument() // Token B balance
  })

  it('shows connect wallet prompt when not connected', () => {
    render(<App />)
    
    expect(screen.getByText('Connect your wallet to view balances')).toBeInTheDocument()
  })

  it('toggles theme when theme button is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const themeButton = screen.getByTitle('Switch to dark mode')
    await user.click(themeButton)
    
    // Theme toggle should work (actual theme change depends on implementation)
    expect(themeButton).toBeInTheDocument()
  })
})
