import { useEffect, useState } from 'react'
import * as fcl from '@onflow/fcl'
import { Toaster, toast } from 'react-hot-toast'
import { useAppStore } from './store'
import { motion } from 'framer-motion'
import { Wallet, ArrowUpDown, Plus, Minus, TrendingUp } from 'lucide-react'

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
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
            {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
          </span>
          <button 
            className="px-3 py-1 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition" 
            onClick={() => fcl.unauthenticate()}
          >
            Disconnect
          </button>
        </>
      ) : (
        <button 
          className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition inline-flex items-center gap-2 font-medium" 
          onClick={() => fcl.logIn()}
        >
          <Wallet className="w-4 h-4" /> Connect Wallet
        </button>
      )}
    </div>
  )
}

function Card(props: { title: string; children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.45, delay: props.delay ?? 0 }}
      className={`p-6 rounded-2xl border border-white/20 bg-white/80 dark:bg-white/10 shadow-xl backdrop-blur-md ${props.className || ''}`}
    >
      <h2 className="font-semibold mb-4 text-slate-800 text-lg">{props.title}</h2>
      {props.children}
    </motion.div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div className="space-y-2">
      {props.label && <label className="text-sm font-medium text-slate-700">{props.label}</label>}
      <input 
        {...props} 
        className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition ${props.className || ''}`} 
      />
    </div>
  )
}

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }) {
  const baseClasses = "px-6 py-3 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200"
  }
  
  return (
    <button 
      {...props} 
      className={`${baseClasses} ${variants[props.variant || 'primary']} ${props.className || ''}`} 
    />
  )
}

function PoolInfo() {
  const [reserves, setReserves] = useState({ reserveA: 1000, reserveB: 2000 })
  const [loading, setLoading] = useState(false)

  const fetchReserves = async () => {
    setLoading(true)
    try {
      // Simulate API call - replace with actual contract call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setReserves({ reserveA: 1000 + Math.random() * 100, reserveB: 2000 + Math.random() * 200 })
    } catch (error) {
      console.error('Error fetching reserves:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReserves()
    const interval = setInterval(fetchReserves, 10000)
    return () => clearInterval(interval)
  }, [])

  const price = reserves.reserveB / reserves.reserveA

  return (
    <Card title="Pool Information" delay={0.05}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">Token A</div>
            <div className="text-2xl font-bold text-blue-800">
              {loading ? '...' : reserves.reserveA.toFixed(2)}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
            <div className="text-sm text-purple-600 font-medium">Token B</div>
            <div className="text-2xl font-bold text-purple-800">
              {loading ? '...' : reserves.reserveB.toFixed(2)}
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-xl bg-green-50 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-600 font-medium">Current Price</span>
          </div>
          <div className="text-xl font-bold text-green-800">
            1 A = {loading ? '...' : price.toFixed(4)} B
          </div>
        </div>
      </div>
    </Card>
  )
}

function SwapInterface() {
  const [fromToken, setFromToken] = useState('A')
  const [toToken, setToToken] = useState('B')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fromAmount) return

    setLoading(true)
    try {
      // Simulate swap - replace with actual contract call
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success(`Swapped ${fromAmount} ${fromToken} for ${toAmount} ${toToken}`)
      setFromAmount('')
      setToAmount('')
    } catch (error) {
      toast.error('Swap failed')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const swapTokens = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  return (
    <Card title="Swap Tokens" delay={0.1}>
      <form onSubmit={handleSwap} className="space-y-4">
        <div className="space-y-3">
          <Input
            label="From"
            type="number"
            placeholder="0.0"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            className="text-right text-lg"
          />
          <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-slate-100">
            <span className="font-medium text-slate-700">Token {fromToken}</span>
            <button
              type="button"
              onClick={swapTokens}
              className="p-2 rounded-full bg-white hover:bg-slate-50 transition"
            >
              <ArrowUpDown className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <Input
            label="To"
            type="number"
            placeholder="0.0"
            value={toAmount}
            onChange={(e) => setToAmount(e.target.value)}
            className="text-right text-lg"
            readOnly
          />
          <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-slate-100">
            <span className="font-medium text-slate-700">Token {toToken}</span>
          </div>
        </div>

        <Button type="submit" disabled={loading || !fromAmount} className="w-full">
          {loading ? 'Swapping...' : 'Swap Tokens'}
        </Button>
      </form>
    </Card>
  )
}

function LiquidityInterface() {
  const [tokenAAmount, setTokenAAmount] = useState('')
  const [tokenBAmount, setTokenBAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState<'add' | 'remove'>('add')

  const handleLiquidity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tokenAAmount || !tokenBAmount) return

    setLoading(true)
    try {
      // Simulate liquidity operation - replace with actual contract call
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success(`${action === 'add' ? 'Added' : 'Removed'} liquidity successfully`)
      setTokenAAmount('')
      setTokenBAmount('')
    } catch (error) {
      toast.error(`${action === 'add' ? 'Add' : 'Remove'} liquidity failed`)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="Liquidity Pool" delay={0.15}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={action === 'add' ? 'primary' : 'secondary'}
            onClick={() => setAction('add')}
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Liquidity
          </Button>
          <Button
            variant={action === 'remove' ? 'primary' : 'secondary'}
            onClick={() => setAction('remove')}
            className="flex-1"
          >
            <Minus className="w-4 h-4 mr-2" />
            Remove Liquidity
          </Button>
        </div>

        <form onSubmit={handleLiquidity} className="space-y-4">
          <Input
            label="Token A Amount"
            type="number"
            placeholder="0.0"
            value={tokenAAmount}
            onChange={(e) => setTokenAAmount(e.target.value)}
          />
          <Input
            label="Token B Amount"
            type="number"
            placeholder="0.0"
            value={tokenBAmount}
            onChange={(e) => setTokenBAmount(e.target.value)}
          />
          
          <Button type="submit" disabled={loading || !tokenAAmount || !tokenBAmount} className="w-full">
            {loading ? `${action === 'add' ? 'Adding' : 'Removing'}...` : `${action === 'add' ? 'Add' : 'Remove'} Liquidity`}
          </Button>
        </form>
      </div>
    </Card>
  )
}

function UserBalances() {
  const userAddress = useAppStore((s) => s.userAddress)
  const [balances, setBalances] = useState({ tokenA: 1000, tokenB: 500 })

  useEffect(() => {
    if (userAddress) {
      // Simulate fetching balances - replace with actual contract calls
      setBalances({ tokenA: 1000 + Math.random() * 100, tokenB: 500 + Math.random() * 50 })
    }
  }, [userAddress])

  if (!userAddress) {
    return (
      <Card title="Your Balances" delay={0.2}>
        <div className="text-center py-8 text-slate-500">
          Connect your wallet to view balances
        </div>
      </Card>
    )
  }

  return (
    <Card title="Your Balances" delay={0.2}>
      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 rounded-xl bg-blue-50">
          <span className="font-medium text-blue-800">Token A</span>
          <span className="text-lg font-bold text-blue-900">{balances.tokenA.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center p-3 rounded-xl bg-purple-50">
          <span className="font-medium text-purple-800">Token B</span>
          <span className="text-lg font-bold text-purple-900">{balances.tokenB.toFixed(2)}</span>
        </div>
      </div>
    </Card>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <motion.header 
          initial={{ opacity: 0, y: -8 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Flow DEX
            </h1>
            <p className="text-slate-600 mt-1">Decentralized Exchange on Flow</p>
          </div>
          <Connect />
        </motion.header>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SwapInterface />
            <LiquidityInterface />
          </div>
          <div className="space-y-6">
            <PoolInfo />
            <UserBalances />
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center py-8"
        >
          <p className="text-slate-600">
            Trade tokens, provide liquidity, and earn rewards on the Flow blockchain
          </p>
        </motion.div>
      </div>
    </div>
  )
}