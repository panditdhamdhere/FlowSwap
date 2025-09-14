import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock FCL
vi.mock('@onflow/fcl', () => ({
  config: vi.fn(() => ({
    put: vi.fn(() => ({})),
  })),
  currentUser: vi.fn(() => ({
    subscribe: vi.fn((callback) => {
      callback({ addr: null })
      return () => {}
    })
  })),
  logIn: vi.fn(),
  unauthenticate: vi.fn(),
  mutate: vi.fn(() => Promise.resolve('mock-tx-hash')),
  query: vi.fn(() => Promise.resolve([1000, 2000, 100, 2.0, 0.5])),
  tx: vi.fn(() => ({
    onceSealed: vi.fn(() => Promise.resolve())
  }))
}))

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn()
  },
  Toaster: vi.fn(() => null)
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    button: 'button',
    span: 'span',
    header: 'header',
    h1: 'h1',
    p: 'p'
  }
}))

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
