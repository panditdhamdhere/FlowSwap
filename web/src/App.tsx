import { useEffect, useState } from 'react'
import * as fcl from '@onflow/fcl'
import { Toaster, toast } from 'react-hot-toast'
import { useAppStore } from './store'
import { useBalances } from './hooks/useBalances'
import { usePairData } from './hooks/usePairData'
import { mintTokens, addLiquidity, swap } from './transactions'
import { motion } from 'framer-motion'
import { Wallet } from 'lucide-react'

function Connect() {
  const userAddress = useAppStore((s) => s.userAddress)
  const setUserAddress = useAppStore((s) => s.setUserAddress)

  useEffect(() => {
    return fcl.currentUser().subscribe((user) => setUserAddress(user?.addr ?? null))
  }, [setUserAddress])

  return (
    <div className="flex items-center gap-2">
      {userAddress ? (
        <>
          <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-sm font-medium">{userAddress}</span>
          <button className="px-3 py-1 rounded bg-slate-800 text-white hover:bg-slate-700 transition" onClick={() => fcl.unauthenticate()}>Disconnect</button>
        </>
      ) : (
        <button className="px-3 py-1 rounded bg-brand-600 text-white hover:bg-brand-500 transition inline-flex items-center gap-2" onClick={() => fcl.logIn()}>
          <Wallet className="w-4 h-4" /> Connect
        </button>
      )}
    </div>
  )
}

function Card(props: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.45, delay: props.delay ?? 0 }}
      className="p-5 rounded-xl border border-white/20 bg-white/60 dark:bg-white/10 shadow-glass backdrop-blur-md"
    >
      <h2 className="font-semibold mb-3 text-slate-800">{props.title}</h2>
      {props.children}
    </motion.div>
  )
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`border border-slate-200 focus:border-brand-400 outline-none p-2 rounded w-full transition ${props.className ?? ''}`} />
}

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`px-4 py-2 rounded bg-brand-600 text-white hover:bg-brand-500 disabled:opacity-50 transition ${props.className ?? ''}`} />
}

function Balances() {
  const { balances, loading } = useBalances()
  
  return (
    <div className="text-sm space-y-1">
      {loading ? (
        <div className="text-gray-500 animate-pulse">Loading balances...</div>
      ) : (
        <>
          <div>TEST1: {balances.test1}</div>
          <div>TEST2: {balances.test2}</div>
        </>
      )}
    </div>
  )
}

function PairInfo() {
  const { reserves, loading } = usePairData()
  const pairId = useAppStore((s) => s.pairId)
  
  return (
    <div className="text-sm space-y-1">
      {loading ? (
        <div className="text-gray-500 animate-pulse">Loading reserves...</div>
      ) : (
        <>
          <div>Pair: {pairId}</div>
          <div>Reserve A: {reserves.reserveA}</div>
          <div>Reserve B: {reserves.reserveB}</div>
        </>
      )}
    </div>
  )
}

export default function App() {
  const pairId = useAppStore((s) => s.pairId)
  const [mintAmount1, setMintAmount1] = useState('1000')
  const [mintAmount2, setMintAmount2] = useState('1000')
  const [liquidityAmountA, setLiquidityAmountA] = useState('100')
  const [liquidityAmountB, setLiquidityAmountB] = useState('100')
  const [swapAmountIn, setSwapAmountIn] = useState('10')
  const [swapMinOut, setSwapMinOut] = useState('9')
  const [swapDirection, setSwapDirection] = useState<'AtoB' | 'BtoA'>('AtoB')
  const [loading, setLoading] = useState(false)

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await mintTokens(parseFloat(mintAmount1), parseFloat(mintAmount2))
      toast.success('Tokens minted!')
    } catch (error) {
      toast.error('Failed to mint tokens')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddLiquidity = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await addLiquidity(pairId, parseFloat(liquidityAmountA), parseFloat(liquidityAmountB))
      toast.success('Liquidity added!')
    } catch (error) {
      toast.error('Failed to add liquidity')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await swap(pairId, parseFloat(swapAmountIn), parseFloat(swapMinOut), swapDirection)
      toast.success('Swap completed!')
    } catch (error) {
      toast.error('Failed to swap')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50">
      <Toaster />
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <motion.header 
          initial={{ opacity: 0, y: -8 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-brand-700 bg-clip-text text-transparent">Flow DEX</h1>
          <Connect />
        </motion.header>

        <div className="grid md:grid-cols-2 gap-6">
          <Card title="Your Balances" delay={0.05}><Balances /></Card>
          <Card title="Pair Info" delay={0.1}><PairInfo /></Card>
        </div>

        <Card title="Mint Test Tokens" delay={0.15}>
          <form className="space-y-3" onSubmit={handleMint}>
            <div className="grid grid-cols-2 gap-3">
              <Field placeholder="Amount TEST1" value={mintAmount1} onChange={(e) => setMintAmount1(e.target.value)} />
              <Field placeholder="Amount TEST2" value={mintAmount2} onChange={(e) => setMintAmount2(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading}>{loading ? 'Minting...' : 'Mint Tokens'}</Button>
          </form>
        </Card>

        <section className="grid md:grid-cols-2 gap-6">
          <Card title={`Add Liquidity (${pairId})`} delay={0.2}>
            <form className="space-y-3" onSubmit={handleAddLiquidity}>
              <div className="grid grid-cols-2 gap-3">
                <Field placeholder="Amount TEST1" value={liquidityAmountA} onChange={(e) => setLiquidityAmountA(e.target.value)} />
                <Field placeholder="Amount TEST2" value={liquidityAmountB} onChange={(e) => setLiquidityAmountB(e.target.value)} />
              </div>
              <Button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Liquidity'}</Button>
            </form>
          </Card>

          <Card title="Swap" delay={0.25}>
            <form className="space-y-3" onSubmit={handleSwap}>
              <select 
                className="border border-slate-200 focus:border-brand-400 outline-none p-2 rounded w-full transition"
                value={swapDirection}
                onChange={(e) => setSwapDirection(e.target.value as 'AtoB' | 'BtoA')}
              >
                <option value="AtoB">TEST1 → TEST2</option>
                <option value="BtoA">TEST2 → TEST1</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <Field placeholder="Amount In" value={swapAmountIn} onChange={(e) => setSwapAmountIn(e.target.value)} />
                <Field placeholder="Min Out" value={swapMinOut} onChange={(e) => setSwapMinOut(e.target.value)} />
              </div>
              <Button type="submit" disabled={loading}>{loading ? 'Swapping...' : 'Swap'}</Button>
            </form>
          </Card>
        </section>
      </div>
    </div>
  )
}
