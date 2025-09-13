import { useEffect, useState } from 'react'
import * as fcl from '@onflow/fcl'
import { Toaster, toast } from 'react-hot-toast'
import { useAppStore } from './store'
import { useTheme } from './contexts/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, ArrowUpDown, Plus, Minus, TrendingUp, Zap, Shield, Globe, Sun, Moon } from 'lucide-react'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  const handleToggle = () => {
    console.log('Theme toggle clicked, current theme:', theme)
    toggleTheme()
  }

  return (
    <div className="flex items-center gap-3">
      <span 
        className="text-sm font-bold px-3 py-2 rounded-lg shadow-lg transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
          color: '#ffffff',
          textShadow: '0 1px 2px rgba(0,0,0,0.2)'
        }}
      >
        {theme === 'light' ? '☀️ Light' : '🌙 Dark'}
      </span>
      <button
        onClick={handleToggle}
        className="p-3 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-2 border-white/30 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-110"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        type="button"
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5 text-slate-700" />
        ) : (
          <Sun className="w-5 h-5 text-yellow-500" />
        )}
      </button>
    </div>
  )
}

function Connect() {
  const userAddress = useAppStore((s) => s.userAddress)
  const setUserAddress = useAppStore((s) => s.setUserAddress)

  useEffect(() => {
    return fcl.currentUser().subscribe((user) => setUserAddress(user?.addr ?? null))
  }, [setUserAddress])

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center gap-3"
    >
      {userAddress ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2"
        >
          <motion.span 
            whileHover={{ scale: 1.05 }}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 text-white text-sm font-medium shadow-lg"
          >
            {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
          </motion.span>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-full bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-700 dark:hover:bg-slate-600 transition-all duration-200 shadow-lg" 
            onClick={() => fcl.unauthenticate()}
          >
            Disconnect
          </motion.button>
        </motion.div>
      ) : (
        <motion.button 
          whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)" }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 inline-flex items-center gap-2 font-medium shadow-xl" 
          onClick={() => fcl.logIn()}
        >
          <Wallet className="w-5 h-5" /> 
          <span>Connect Wallet</span>
        </motion.button>
      )}
    </motion.div>
  )
}

function Card(props: { title: string; children: React.ReactNode; delay?: number; className?: string; icon?: React.ReactNode }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, scale: 0.95 }} 
      animate={{ opacity: 1, y: 0, scale: 1 }} 
      transition={{ duration: 0.6, delay: props.delay ?? 0, type: "spring", stiffness: 100 }}
      whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
      className={`p-6 rounded-3xl border border-white/30 dark:border-slate-700/30 bg-white/90 dark:bg-slate-800/90 shadow-2xl backdrop-blur-xl ${props.className || ''}`}
    >
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: (props.delay ?? 0) + 0.2 }}
        className="flex items-center gap-3 mb-6"
      >
        {props.icon && (
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
            className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white"
          >
            {props.icon}
          </motion.div>
        )}
        <h2 className="font-bold text-slate-800 dark:text-slate-200 text-xl">{props.title}</h2>
      </motion.div>
      {props.children}
    </motion.div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-2"
    >
      {props.label && (
        <motion.label 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-sm font-semibold text-slate-700 dark:text-slate-300"
        >
          {props.label}
        </motion.label>
      )}
      <motion.input 
        whileFocus={{ scale: 1.02, boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)" }}
        {...props} 
        className={`w-full px-4 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 outline-none transition-all duration-300 text-lg font-medium bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 ${props.className || ''}`} 
      />
    </motion.div>
  )
}

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'gradient' }) {
  const baseClasses = "px-6 py-4 rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:shadow-xl",
    secondary: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 hover:shadow-lg",
    gradient: "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 hover:shadow-xl"
  }

  return (
    <motion.button 
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
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
    <Card title="Pool Information" delay={0.05} icon={<TrendingUp className="w-5 h-5" />}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <motion.div 
            whileHover={{ scale: 1.05, rotateY: 5 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 shadow-lg"
          >
            <div className="text-sm text-blue-600 font-semibold mb-2">Token A</div>
            <motion.div 
              key={reserves.reserveA}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-3xl font-bold text-blue-800"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
                />
              ) : (
                reserves.reserveA.toFixed(2)
              )}
            </motion.div>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05, rotateY: -5 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 shadow-lg"
          >
            <div className="text-sm text-purple-600 font-semibold mb-2">Token B</div>
            <motion.div 
              key={reserves.reserveB}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-3xl font-bold text-purple-800"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"
                />
              ) : (
                reserves.reserveB.toFixed(2)
              )}
            </motion.div>
          </motion.div>
        </div>
        
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="p-6 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <TrendingUp className="w-6 h-6 text-green-600" />
            </motion.div>
            <span className="text-lg text-green-700 font-bold">Current Price</span>
          </div>
          <motion.div 
            key={price}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-2xl font-bold text-green-800"
          >
            1 A = {loading ? '...' : price.toFixed(4)} B
          </motion.div>
        </motion.div>
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
    <Card title="Swap Tokens" delay={0.1} icon={<ArrowUpDown className="w-5 h-5" />}>
      <form onSubmit={handleSwap} className="space-y-6">
        <div className="space-y-4">
          <Input
            label="From"
            type="number"
            placeholder="0.0"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            className="text-right text-xl font-bold"
          />
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center justify-between px-5 py-4 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 border-2 border-slate-200 shadow-lg"
          >
            <span className="font-bold text-slate-700 text-lg">Token {fromToken}</span>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={swapTokens}
              className="p-3 rounded-full bg-white hover:bg-slate-50 transition-all duration-300 shadow-lg border-2 border-slate-200"
            >
              <ArrowUpDown className="w-5 h-5 text-slate-600" />
            </motion.button>
          </motion.div>
        </div>

        <div className="space-y-4">
          <Input
            label="To"
            type="number"
            placeholder="0.0"
            value={toAmount}
            onChange={(e) => setToAmount(e.target.value)}
            className="text-right text-xl font-bold"
            readOnly
          />
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center justify-between px-5 py-4 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 border-2 border-slate-200 shadow-lg"
          >
            <span className="font-bold text-slate-700 text-lg">Token {toToken}</span>
          </motion.div>
        </div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button type="submit" disabled={loading || !fromAmount} variant="gradient" className="w-full text-lg py-4">
            {loading ? (
              <motion.div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                Swapping...
              </motion.div>
            ) : (
              'Swap Tokens'
            )}
          </Button>
        </motion.div>
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
    <Card title="Liquidity Pool" delay={0.15} icon={<Zap className="w-5 h-5" />}>
      <div className="space-y-6">
        <div className="flex gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1"
          >
            <Button
              variant={action === 'add' ? 'gradient' : 'secondary'}
              onClick={() => setAction('add')}
              className="w-full flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Liquidity
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1"
          >
            <Button
              variant={action === 'remove' ? 'gradient' : 'secondary'}
              onClick={() => setAction('remove')}
              className="w-full flex items-center justify-center gap-2"
            >
              <Minus className="w-5 h-5" />
              Remove Liquidity
            </Button>
          </motion.div>
        </div>

        <form onSubmit={handleLiquidity} className="space-y-6">
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
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button type="submit" disabled={loading || !tokenAAmount || !tokenBAmount} variant="gradient" className="w-full text-lg py-4">
              {loading ? (
                <motion.div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  {action === 'add' ? 'Adding...' : 'Removing...'}
                </motion.div>
              ) : (
                `${action === 'add' ? 'Add' : 'Remove'} Liquidity`
              )}
            </Button>
          </motion.div>
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
      setBalances({ tokenA: 1000 + Math.random() * 100, tokenB: 500 + Math.random() * 50 })
    }
  }, [userAddress])

  if (!userAddress) {
    return (
      <Card title="Your Balances" delay={0.2} icon={<Shield className="w-5 h-5" />}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center"
          >
            <Wallet className="w-8 h-8 text-white" />
          </motion.div>
          <p className="text-slate-500 text-lg">Connect your wallet to view balances</p>
        </motion.div>
      </Card>
    )
  }

  return (
    <Card title="Your Balances" delay={0.2} icon={<Shield className="w-5 h-5" />}>
      <div className="space-y-4">
        <motion.div 
          whileHover={{ scale: 1.02, x: 5 }}
          className="flex justify-between items-center p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 shadow-lg"
        >
          <span className="font-bold text-blue-800 text-lg">Token A</span>
          <motion.span 
            key={balances.tokenA}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-xl font-bold text-blue-900"
          >
            {balances.tokenA.toFixed(2)}
          </motion.span>
        </motion.div>
        <motion.div 
          whileHover={{ scale: 1.02, x: 5 }}
          className="flex justify-between items-center p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-200 shadow-lg"
        >
          <span className="font-bold text-purple-800 text-lg">Token B</span>
          <motion.span 
            key={balances.tokenB}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-xl font-bold text-purple-900"
          >
            {balances.tokenB.toFixed(2)}
          </motion.span>
        </motion.div>
      </div>
    </Card>
  )
}

function FloatingElements() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  )
}

export default function App() {
  return (
    <div 
      className="min-h-screen relative overflow-hidden transition-colors duration-300"
      style={{
        background: 'var(--bg-primary)',
        backgroundImage: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--accent-primary) 25%, var(--accent-secondary) 75%, var(--bg-primary) 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradient-shift 8s ease infinite'
      }}
    >
      <FloatingElements />
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          },
        }}
      />
      <div className="max-w-7xl mx-auto p-6 space-y-8 relative z-10">
        <motion.header 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
          className="flex items-center justify-between"
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <div>
                <motion.h1 
                  whileHover={{ scale: 1.02 }}
                  className="text-4xl font-bold text-white"
                >
                  FlowSwap
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-slate-300 text-sm font-medium"
                >
                  Decentralized Exchange on Flow
                </motion.p>
              </div>
            </div>
          </motion.div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Connect />
          </div>
        </motion.header>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <SwapInterface />
            <LiquidityInterface />
          </div>
          <div className="space-y-8">
            <PoolInfo />
            <UserBalances />
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center py-12"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 shadow-lg"
          >
            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              Trade tokens, provide liquidity, and earn rewards on the Flow blockchain
            </span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}