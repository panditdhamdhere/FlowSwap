import { create } from 'zustand'

interface AppState {
  userAddress: string | null
  setUserAddress: (addr: string | null) => void
  pairId: string
  setPairId: (id: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  userAddress: null,
  setUserAddress: (addr) => set({ userAddress: addr }),
  pairId: 'TEST-PAIR',
  setPairId: (pairId) => set({ pairId }),
}))
